import { NextResponse } from 'next/server';

const TB_URL = process.env.NEXT_PUBLIC_TB_URL;

export async function POST(req) {
  try {
    const { token, deviceId, keys } = await req.json();

    if (!token || !deviceId || !keys) {
      return NextResponse.json({ error: 'Missing required data: token, deviceId, or keys' }, { status: 400 });
    }

    const params = new URLSearchParams();
    params.append('keys', keys);

    const url = `${TB_URL}/api/plugins/telemetry/DEVICE/${deviceId}/values/attributes/SHARED_SCOPE?${params.toString()}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Authorization': `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: `Failed to fetch device attributes: ${errorText}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Fetch device attributes error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}