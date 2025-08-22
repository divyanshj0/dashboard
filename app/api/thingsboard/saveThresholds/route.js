import { NextResponse } from 'next/server';

const TB_URL = process.env.NEXT_PUBLIC_TB_URL;

export async function POST(req) {
  try {
    const { token, deviceId, thresholds } = await req.json();

    if (!token || !deviceId || !thresholds) {
      return NextResponse.json({ error: 'Missing token, deviceId, or thresholds' }, { status: 400 });
    }

    const response = await fetch(`${TB_URL}/api/plugins/telemetry/DEVICE/${deviceId}/attributes/SHARED_SCOPE`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        thresholds: thresholds,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText || 'Failed to save thresholds' }, { status: response.status });
    }

    return NextResponse.json({ success: true, message: 'Thresholds saved successfully' });

  } catch (error) {
    console.error('Save thresholds error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}