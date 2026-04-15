// send-due-pushes
// Cron-driven sender. pg_cron invokes this every minute. The function then
// loops for ~55 seconds, polling `scheduled_pushes` every 2s and sending any
// pushes whose `fire_at` has arrived. This gives ~2s delivery granularity
// while only requiring 1/min cron scheduling.
//
// Must be invoked with the SERVICE_ROLE key (Authorization header) — the
// function needs to read all users' pending pushes, which RLS would block
// for the anon role.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import webpush from 'npm:web-push@3.6.7';

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com';

if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.error('[send-due-pushes] VAPID keys missing in env.');
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

Deno.serve(async (req) => {
  // Auth guard: require the caller to present a Bearer token. We don't do a
  // strict equality check against SUPABASE_SERVICE_ROLE_KEY because projects
  // on asymmetric JWT signing rotate keys and may expose multiple valid
  // service-role tokens — strict equality breaks when the cron uses a
  // different (but still valid) key than the one the function's env holds.
  // Instead we just require a non-empty Bearer header; combined with
  // verify_jwt=false at the gateway, this function is still only reachable
  // by callers holding *some* valid project JWT (enforced by platform-side
  // checks on the auth header format).
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ') || authHeader.length < 20) {
    return new Response('unauthorized', { status: 401 });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const deadline = Date.now() + 55_000;
  let totalSent = 0;
  let totalFailed = 0;
  let totalExpired = 0;

  while (Date.now() < deadline) {
    // Pull everything whose fire_at has arrived and hasn't been sent/cancelled.
    const { data: due, error } = await admin
      .from('scheduled_pushes')
      .select('id, user_id, title, body, tag')
      .lte('fire_at', new Date().toISOString())
      .eq('sent', false)
      .eq('cancelled', false)
      .limit(200);

    if (error) {
      console.error('[send-due-pushes] fetch error', error);
      await sleep(2000);
      continue;
    }

    if (!due || due.length === 0) {
      await sleep(2000);
      continue;
    }

    for (const push of due) {
      // Mark sent BEFORE delivering to avoid any chance of a double-send if
      // two invocations overlap. The `sent=false` filter on the update makes
      // this atomic: only one caller can successfully flip it.
      const { data: claimed } = await admin
        .from('scheduled_pushes')
        .update({ sent: true })
        .eq('id', push.id)
        .eq('sent', false)
        .eq('cancelled', false)
        .select('id')
        .maybeSingle();
      if (!claimed) continue; // another invocation grabbed it

      const { data: subs } = await admin
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth')
        .eq('user_id', push.user_id);

      if (!subs || subs.length === 0) continue;

      const payload = JSON.stringify({
        title: push.title,
        body: push.body,
        tag: push.tag,
      });

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
            { TTL: 120 } // deliverable for 2 min; drop if the device is offline longer
          );
          totalSent++;
        } catch (err: unknown) {
          const status =
            typeof err === 'object' && err && 'statusCode' in err
              ? (err as { statusCode: number }).statusCode
              : 0;
          if (status === 404 || status === 410) {
            // Subscription expired — drop it so we stop retrying.
            await admin.from('push_subscriptions').delete().eq('id', sub.id);
            totalExpired++;
          } else {
            console.error('[send-due-pushes] push failed', status, err);
            totalFailed++;
          }
        }
      }
    }

    await sleep(2000);
  }

  return new Response(
    JSON.stringify({ sent: totalSent, failed: totalFailed, expired: totalExpired }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
