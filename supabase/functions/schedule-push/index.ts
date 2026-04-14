// schedule-push
// Client-callable. Inserts a row into `scheduled_pushes` which the cron-driven
// `send-due-pushes` function will deliver when `fire_at` passes.
//
// Request body: { fire_at: ISO8601 string, title, body, tag? }
// Response:     { id } on success, { error } on failure.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'missing authorization header' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return json({ error: 'unauthorized' }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid json body' }, 400);
  }

  const fireAt = body.fire_at as string;
  const title = body.title as string;
  const messageBody = body.body as string;
  const tag = (body.tag as string) || 'rest-timer';

  if (!fireAt || !title || !messageBody) {
    return json({ error: 'fire_at, title, body are required' }, 400);
  }

  // Reject anything more than 1 hour in the future so a bug can't queue spam.
  const fireAtMs = Date.parse(fireAt);
  if (!Number.isFinite(fireAtMs)) {
    return json({ error: 'fire_at is not a valid date' }, 400);
  }
  if (fireAtMs > Date.now() + 60 * 60 * 1000) {
    return json({ error: 'fire_at too far in the future (max 1h)' }, 400);
  }

  const { data, error } = await supabase
    .from('scheduled_pushes')
    .insert({
      user_id: userData.user.id,
      fire_at: fireAt,
      title,
      body: messageBody,
      tag,
    })
    .select('id')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json({ id: data.id });
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
