import { NextResponse } from 'next/server';

const TB_URL = 'https://demo.thingsboard.io';

export async function POST(req) {
  const { token, devices: devicesRaw } = await req.json();

  let devices;
  try {
    devices = typeof devicesRaw === 'string' ? JSON.parse(devicesRaw) : devicesRaw;
  } catch (e) {
    return NextResponse.json({ error: 'Invalid devices format' }, { status: 400 });
  }

  try {
    const results = {};

   for (const device of devices) {
  const deviceId = device.id.id;
  const deviceName = device.name;

  // Step 1: Get server attributes to find telemetry keys
  const attrRes = await fetch(`${TB_URL}/api/plugins/telemetry/DEVICE/${deviceId}/values/attributes/SERVER_SCOPE`, {
    headers: { 'X-Authorization': `Bearer ${token}` },
  });

  const attrData = await attrRes.json();
  const telemetryKeysEntry = attrData.find(attr => attr.key === 'telemetryKeys');

  if (!telemetryKeysEntry || !Array.isArray(telemetryKeysEntry.value?.telemetryKeys)) {
    console.warn(`No valid telemetryKeys attribute found for device ${deviceName}`);
    continue;
  }

  const telemetryKeys = telemetryKeysEntry.value.telemetryKeys;

  // Step 2: Fetch telemetry for these keys
  const telemetryRes = await fetch(`${TB_URL}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${telemetryKeys.join(',')}`, {
    headers: { 'X-Authorization': `Bearer ${token}` },
  });

  if (!telemetryRes.ok) {
    throw new Error(`Failed to fetch telemetry from ${deviceName}`);
  }

  const telemetry = await telemetryRes.json();
  results[deviceName] = telemetry;
}
    return NextResponse.json(results);
  } catch (err) {
    console.error('Telemetry fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
