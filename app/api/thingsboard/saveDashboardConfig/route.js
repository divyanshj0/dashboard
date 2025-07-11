import { NextResponse } from 'next/server';
const TB_URL = 'https://demo.thingsboard.io';
export async function POST(req) {
  const { token, userId, config } = await req.json();

  if (!token || !userId || !config) {
    return NextResponse.json({ error: 'Missing token or userID or config' }, { status: 400 });
  }

  try {
    // Save config to ThingsBoard user attributes
    const response = await fetch(`${TB_URL}/api/plugins/telemetry/USER/${userId}/attributes/SERVER_SCOPE`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          dashboardConfig: config, // Save under the key `dashboardConfig`
        }),
      }
    );
    return NextResponse.json({ status: 'ok' });

  } catch (err) {
    console.error('Error saving dashboard config:', err);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
