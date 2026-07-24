const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');
  if (!clientSecret) {
    return json({ error: 'Server is missing STRAVA_CLIENT_SECRET' }, 500);
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.client_id || !body.grant_type) {
    return json({ error: 'Missing required Strava token fields' }, 400);
  }

  const res = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: body.client_id,
      client_secret: clientSecret,
      code: body.code,
      refresh_token: body.refresh_token,
      grant_type: body.grant_type,
    }),
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'application/json',
      ...corsHeaders,
    },
  });
});

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
