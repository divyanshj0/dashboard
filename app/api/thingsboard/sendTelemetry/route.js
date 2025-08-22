// /app/api/sendTelemetry/route.js
import { NextResponse } from 'next/server';

const TB_BASE_URL = process.env.NEXT_PUBLIC_TB_URL;

export async function POST(req) {
  const { token, deviceId, telemetryData } = await req.json();

  if (!token || !deviceId || !telemetryData || typeof telemetryData !== 'object' || Object.keys(telemetryData).length === 0) {
    return NextResponse.json({ error: 'Missing required data: token, deviceId, or telemetryData' }, { status: 400 });
  }
  const credRes = await fetch(`${TB_BASE_URL}/api/device/${deviceId}/credentials`, {
    headers: { 'X-Authorization': `Bearer ${token}` },
  });

  const credentials = await credRes.json();
  const DEVICE_ACCESS_TOKEN = credentials.credentialsId;

  try {
    const res = await fetch(`${TB_BASE_URL}/api/v1/${DEVICE_ACCESS_TOKEN}/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(telemetryData),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Failed to send telemetry: ${errText}` }, { status: res.status });
    }

    return NextResponse.json({ message: 'Telemetry sent successfully' });
  } catch (error) {
    console.error('Telemetry POST error:', error);
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 });
  }
}