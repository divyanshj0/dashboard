import { NextResponse } from 'next/server';
const TB_URL = 'https://demo.thingsboard.io';

export async function POST(req) {
  const { token, devices } = await req.json();

  const userRes = await fetch(`${TB_URL}/api/auth/user`, {
    headers: { 'X-Authorization': `Bearer ${token}` }
  });
  const user = await userRes.json();
  const userId = user.id.id;

  // Fetch dashboardConfig attribute
  const attrRes = await fetch(`${TB_URL}/api/plugins/telemetry/USER/${userId}/values/attributes/SERVER_SCOPE`, {
    headers: { 'X-Authorization': `Bearer ${token}` },
  });
  const attr = await attrRes.json();
  let config = {};
  const cfgItem = attr.find(a => a.key === 'dashboardConfig');
  if (cfgItem) {
    config = typeof cfgItem.value === 'string'
      ? JSON.parse(cfgItem.value)
      : cfgItem.value;
  }
  const results = {};

  for (const sec of Object.keys(config)) {
    results[sec] = {};
    for (const item of config[sec]) {
      const res = await fetch(`${TB_URL}/api/plugins/telemetry/DEVICE/${item.deviceId}/values/timeseries?keys=${item.key}`, {
        headers: { 'X-Authorization': `Bearer ${token}` }
      });
      const j = await res.json();
      results[sec][item.key] = j[item.key] || [];
    }
  }

  return NextResponse.json({ telemetry: results, config });
}

