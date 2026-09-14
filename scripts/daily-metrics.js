const https = require('https');
const fs = require('fs');
const path = require('path');

// Fallback load from LIFE-PATH-env.md and IQ-TEST - ENV.md if not in process.env
const envFiles = [
  'C:\\Users\\sinyo\\Desktop\\ENV\\LIFE-PATH-env.md',
  'C:\\Users\\sinyo\\Desktop\\ENV\\IQ-TEST - ENV.md'
];

for (const envFilePath of envFiles) {
  if (fs.existsSync(envFilePath)) {
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    for (const rawLine of envContent.split(/\r?\n/)) {
      const line = rawLine.trim();
      const match = line.match(/^([A-Za-z0-9_\\-]+)=(.*)$/);
      if (match) {
        const key = match[1].replace(/\\/g, "").trim();
        const val = match[2].trim().replace(/^["']|["']$/g, "").replace(/\\/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const CLOUDFLARE_TOKEN = process.env.CLOUDFLARE_AGENT_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
const STRIPE_KEY = process.env.STRIPE_LIVE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://buaxjmahjinuowoidhmn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ZONE_ID = "5419db263eec756845ebf57019a4c412";

function httpsRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function getStripeSales(targetDateIso) {
  if (!STRIPE_KEY) {
    return { count: 0, revenue: 0, error: "STRIPE_LIVE_KEY not set" };
  }
  const startTimestamp = Math.floor(new Date(targetDateIso + "T00:00:00Z").getTime() / 1000);
  const endTimestamp = startTimestamp + 86400;

  const endpoint = `/v1/charges?created[gte]=${startTimestamp}&created[lt]=${endTimestamp}&limit=100`;
  const options = {
    hostname: 'api.stripe.com',
    path: endpoint,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${STRIPE_KEY}` }
  };

  const res = await httpsRequest(options);
  if (!res.data) {
    return { count: 0, revenue: 0, error: res.error ? res.error.message : "Unknown" };
  }

  const successfulCharges = res.data.filter(c => c.status === 'succeeded' && c.paid);
  const totalRevenueCents = successfulCharges.reduce((sum, c) => sum + (c.amount - c.amount_refunded), 0);

  return {
    count: successfulCharges.length,
    revenue: totalRevenueCents / 100
  };
}

async function getCloudflareAnalytics() {
  if (!CLOUDFLARE_TOKEN) {
    return [];
  }

  const query = JSON.stringify({
    query: `query {
      viewer {
        zones(filter: { zoneTag: "${ZONE_ID}" }) {
          httpRequests1dGroups(limit: 30, orderBy: [date_DESC], filter: { date_geq: "2026-09-01" }) {
            dimensions {
              date
            }
            sum {
              requests
              pageViews
            }
            uniq {
              uniques
            }
          }
        }
      }
    }`
  });

  const options = {
    hostname: 'api.cloudflare.com',
    path: '/client/v4/graphql',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(query)
    }
  };

  const res = await httpsRequest(options, query);
  if (res.errors && res.errors.length) {
    console.error("Cloudflare GraphQL Error:", JSON.stringify(res.errors));
  }
  try {
    return res.data.viewer.zones[0].httpRequests1dGroups || [];
  } catch (e) {
    return [];
  }
}

async function getSupabaseEvents(targetDateIso) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return { quizViewed: 0, freeResults: 0, tierClicks: 0, tierBreakdown: {} };
  }

  const startIso = `${targetDateIso}T00:00:00.000Z`;
  const endIso = `${targetDateIso}T23:59:59.999Z`;
  const queryPath = `/rest/v1/lifepath_events?select=event_name,meta&created_at=gte.${startIso}&created_at=lte.${endIso}`;

  const options = {
    hostname: new URL(SUPABASE_URL).hostname,
    path: queryPath,
    method: 'GET',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
  };

  try {
    const records = await httpsRequest(options);
    if (!Array.isArray(records)) {
      return { quizViewed: 0, freeResults: 0, tierClicks: 0, tierBreakdown: {} };
    }

    let quizViewed = 0;
    let freeResults = 0;
    let tierClicks = 0;
    const tierBreakdown = {};

    for (const r of records) {
      if (r.event_name === 'quiz_viewed') quizViewed++;
      if (r.event_name === 'free_result_shown') freeResults++;
      if (r.event_name === 'tier_button_clicked') {
        tierClicks++;
        const tier = (r.meta && r.meta.tier) || 'unknown';
        tierBreakdown[tier] = (tierBreakdown[tier] || 0) + 1;
      }
    }

    return { quizViewed, freeResults, tierClicks, tierBreakdown };
  } catch (e) {
    console.error("Supabase telemetry fetch error:", e.message);
    return { quizViewed: 0, freeResults: 0, tierClicks: 0, tierBreakdown: {} };
  }
}

async function run() {
  const shouldUpdate = process.argv.includes('--update-ledger');
  const targetDate = process.argv.find(arg => /^\d{4}-\d{2}-\d{2}$/.test(arg)) || new Date().toISOString().split('T')[0];

  console.log(`====================================================`);
  console.log(`PULLING DAILY METRICS: ${targetDate}`);
  console.log(`====================================================`);

  const cfRecords = await getCloudflareAnalytics();
  const cfMap = {};
  for (const r of cfRecords) {
    cfMap[r.dimensions.date] = {
      pageViews: r.sum.pageViews,
      uniques: r.uniq.uniques
    };
  }

  const stripeData = await getStripeSales(targetDate);
  const eventsData = await getSupabaseEvents(targetDate);

  const dayViews = cfMap[targetDate] ? cfMap[targetDate].pageViews : 0;
  const dayUniques = cfMap[targetDate] ? cfMap[targetDate].uniques : 0;

  console.log(`Cloudflare Views: ${dayViews} (Unique Visitors: ${dayUniques})`);
  console.log(`Telemetry Events: Quiz Viewed: ${eventsData.quizViewed} | Free Results: ${eventsData.freeResults} | Tier Clicks: ${eventsData.tierClicks}`);
  if (Object.keys(eventsData.tierBreakdown).length > 0) {
    console.log(`Tier Click Breakdown: ${JSON.stringify(eventsData.tierBreakdown)}`);
  }
  console.log(`Stripe Live Sales: ${stripeData.count} transactions, $${stripeData.revenue.toFixed(2)} USD revenue`);

  const freeCompPercent = dayViews > 0 && eventsData.freeResults > 0
    ? ((eventsData.freeResults / dayViews) * 100).toFixed(1) + '%'
    : (eventsData.freeResults > 0 ? '100.0%' : '-');

  const tierClickPercent = eventsData.freeResults > 0 && eventsData.tierClicks > 0
    ? ((eventsData.tierClicks / eventsData.freeResults) * 100).toFixed(1) + '%'
    : (eventsData.tierClicks > 0 ? '100.0%' : '-');

  const paidConvPercent = eventsData.tierClicks > 0
    ? ((stripeData.count / eventsData.tierClicks) * 100).toFixed(1) + '%'
    : (stripeData.count > 0 ? '100.0%' : '-');

  console.log(`Funnel Rates: Free Comp: ${freeCompPercent} | Tier Click: ${tierClickPercent} | Paid Conv: ${paidConvPercent}`);

  if (shouldUpdate) {
    const ledgerPath = path.join(__dirname, '..', 'RUN-WINDOW.md');
    if (fs.existsSync(ledgerPath)) {
      let content = fs.readFileSync(ledgerPath, 'utf8');
      const rowRegex = new RegExp(`(\\|\\s*\\d+\\s*\\|\\s*${targetDate}\\s*\\|)([^\\n]+)`);
      if (rowRegex.test(content)) {
        const freeResVal = eventsData.freeResults > 0 ? eventsData.freeResults : '-';
        const tierClickVal = eventsData.tierClicks > 0 ? eventsData.tierClicks : '-';
        const replacement = `$1 ${dayViews} | ${freeResVal} | ${freeCompPercent} | ${tierClickVal} | ${tierClickPercent} | ${stripeData.count} | ${paidConvPercent} | $${stripeData.revenue.toFixed(2)} |`;
        content = content.replace(rowRegex, replacement);
        fs.writeFileSync(ledgerPath, content, 'utf8');
        console.log(`Updated RUN-WINDOW.md entry for ${targetDate}`);
      }
    }
  }

  console.log(`====================================================`);
}

run();
