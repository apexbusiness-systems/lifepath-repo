const https = require('https');
const fs = require('fs');

// Read from env file or environment
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

const sql = `
CREATE TABLE IF NOT EXISTS lifepath_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  meta JSONB,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lifepath_events_name_idx ON lifepath_events (event_name);
CREATE INDEX IF NOT EXISTS lifepath_events_created_idx ON lifepath_events (created_at);
ALTER TABLE lifepath_events ENABLE ROW LEVEL SECURITY;
`;

if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN not found.");
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
  res.on('end', () => console.log('Create table response:', res.statusCode, b));
});
req.on('error', console.error);
req.write(data);
req.end();
