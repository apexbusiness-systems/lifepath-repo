// Idempotent: creates the lifepath_subscribers table (opt-in email list). Safe to re-run.
// Usage: SUPABASE_ACCESS_TOKEN=... node scripts/setup-subscribers-table.js
// Mirrors scripts/setup-telemetry-table.js (same token lookup, same project).
const https = require('https');
const fs = require('fs');

const envFilePath = 'C:\\Users\\sinyo\\Desktop\\ENV\\IQ-TEST - ENV.md';
let token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token && fs.existsSync(envFilePath)) {
  const content = fs.readFileSync(envFilePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_\\-]+)=(.*)$/);
    if (m && m[1].replace(/\\/g, '').trim() === 'SUPABASE_ACCESS_TOKEN') {
      token = m[2].trim().replace(/^["']|["']$/g, '').replace(/\\/g, '');
    }
  }
}

const projectRef = 'buaxjmahjinuowoidhmn';

// RLS is enabled with no policies: only the service-role key (Worker secret) can read or write.
const sql = `
CREATE TABLE IF NOT EXISTS lifepath_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  life_path SMALLINT,
  source TEXT,
  consent_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lifepath_subscribers_created_idx ON lifepath_subscribers (created_at);
ALTER TABLE lifepath_subscribers ENABLE ROW LEVEL SECURITY;
`;

if (!token) {
  console.error('SUPABASE_ACCESS_TOKEN not found.');
  process.exit(1);
}

const data = JSON.stringify({ query: sql });
const req = https.request({
  hostname: 'api.supabase.com',
  path: `/v1/projects/${projectRef}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    console.log('Create table response:', res.statusCode, b);
    process.exit(res.statusCode >= 200 && res.statusCode < 300 ? 0 : 1);
  });
});
req.on('error', e => { console.error(e); process.exit(1); });
req.write(data);
req.end();
