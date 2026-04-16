// generate-workout-plan — proxies the Claude API for workout plan generation.
// The ANTHROPIC_API_KEY lives in Supabase secrets, never exposed to the browser.

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = 'claude-sonnet-4-20250514';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured in Supabase secrets');
    }

    const { prompt } = await req.json();
    if (!prompt) throw new Error('Missing prompt in request body');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Claude API error ${response.status}`);
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || '';

    // Parse JSON — Claude sometimes wraps in markdown fences
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
    const plan = JSON.parse(cleaned);

    return new Response(JSON.stringify({ plan }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[generate-workout-plan]', e);
    return new Response(
      JSON.stringify({ error: e.message || 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
