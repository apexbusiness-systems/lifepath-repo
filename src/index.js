export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Block automated vulnerability scanner probing on sensitive dotfiles
    if (url.pathname.startsWith('/.env') || url.pathname.startsWith('/.git')) {
      return new Response('404 Not Found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Robots-Tag': 'noindex, nofollow'
        }
      });
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
