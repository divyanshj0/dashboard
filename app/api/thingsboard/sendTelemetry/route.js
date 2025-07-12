// /app/api/sendTelemetry/route.js
import { NextResponse } from 'next/server';

const TB_BASE_URL = 'https://demo.thingsboard.io';

export async function POST(req) {
  const { token, deviceId, key, value } = await req.json();

  if (!token || !deviceId || !key || value === undefined) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  try {
    const res = await fetch(`${TB_BASE_URL}/api/plugins/telemetry/DEVICE/${deviceId}/timeseries/ANY`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ [key]: value }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Failed to send telemetry: ${errText}` }, { status: res.status });
    }

    return NextResponse.json({ message: 'Telemetry sent successfully' });
  } catch (error) {
    console.error('Telemetry POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}