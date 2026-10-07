// Origins allowed to call the write endpoints from a browser (same-origin by design).
const ALLOWED_ORIGINS = new Set([
  'https://life-path.icu',
  'https://www.life-path.icu',
  'http://localhost:8787',
  'http://127.0.0.1:8787'
]);

// Paths probed by automated exploit scanners. This site is static, none of these exist.
const SCANNER_PREFIXES = [
  '/wp-', '/xmlrpc.php', '/wordpress', '/phpmyadmin', '/cgi-bin',
  '/administrator', '/vendor/phpunit', '/.aws', '/.ssh', '/.env', '/.git'
];

const VALID_LIFE_PATHS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]);
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const CONSENT_VERSION = 'v1-result-page-2026-10-06';

const json = (status, body, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra }
  });

/**
 * POST /api/subscribe: stores an opt-in email in Supabase (lifepath_subscribers).
 * Fail-closed: returns ok:true only after Supabase confirms the write, so the UI never claims
 * a save that did not happen.
 */
async function handleSubscribe(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
  }

  const origin = request.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return json(403, { ok: false, error: 'forbidden_origin' });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return json(400, { ok: false, error: 'invalid_json' });

  // Honeypot: bots fill the hidden field. Pretend success, store nothing.
  if (typeof body.company === 'string' && body.company.trim() !== '') return json(200, { ok: true });

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email.length > 254 || !EMAIL_RE.test(email)) return json(400, { ok: false, error: 'invalid_email' });

  const lifePathNum = Number(body.life_path);
  const lifePath = VALID_LIFE_PATHS.has(lifePathNum) ? lifePathNum : null;
  const source = typeof body.source === 'string' ? body.source.slice(0, 64) : null;

  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) return json(503, { ok: false, error: 'storage_not_configured' });
  const supabaseUrl = env.SUPABASE_URL || 'https://buaxjmahjinuowoidhmn.supabase.co';

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/lifepath_subscribers?on_conflict=email`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        // Duplicate emails are a silent success (idempotent), never an error or an existence oracle.
        Prefer: 'resolution=ignore-duplicates,return=minimal'
      },
      body: JSON.stringify({ email, life_path: lifePath, source, consent_version: CONSENT_VERSION })
    });
    if (!res.ok) {
      console.error('Supabase subscribe write failed:', res.status);
      return json(502, { ok: false, error: 'storage_unavailable' });
    }
    return json(200, { ok: true });
  } catch (err) {
    console.error('Supabase subscribe write error:', err);
    return json(502, { ok: false, error: 'storage_unavailable' });
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Block automated vulnerability scanner probing (dotfiles, WordPress, phpMyAdmin, etc.)
    if (SCANNER_PREFIXES.some((p) => url.pathname.startsWith(p))) {
      return new Response('Gone', {
        status: 410,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Robots-Tag': 'noindex, nofollow'
        }
      });
    }

    // Email capture endpoint
    if (url.pathname === '/api/subscribe') {
      return handleSubscribe(request, env);
    }

    // Telemetry Ingestion Endpoint: POST /track or /api/track
    if (url.pathname === '/track' || url.pathname === '/api/track') {
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json().catch(() => ({}));
          const eventName = typeof body.event_name === 'string' ? body.event_name.trim() : null;

          if (eventName) {
            const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || null;
            const userAgent = request.headers.get('user-agent') || null;
            const supabaseUrl = env.SUPABASE_URL || 'https://buaxjmahjinuowoidhmn.supabase.co';
            const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

            if (supabaseKey) {
              const insertPromise = fetch(`${supabaseUrl}/rest/v1/lifepath_events`, {
                method: 'POST',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                  event_name: eventName,
                  meta: body.meta || {},
                  ip: ip,
                  user_agent: userAgent
                })
              }).catch(err => {
                console.error('Supabase telemetry write error:', err);
              });

              if (ctx && typeof ctx.waitUntil === 'function') {
                ctx.waitUntil(insertPromise);
              } else {
                await insertPromise;
              }
            }
          }

          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store'
            }
          });
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: err.message }), {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store'
            }
          });
        }
      }

      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    return env.ASSETS.fetch(request);
  }
};
