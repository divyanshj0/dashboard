    import { NextResponse } from 'next/server';
    const TB_BASE_URL = 'https://demo.thingsboard.io';
    export async function POST(req) {
    try {
        const {token, deviceId, key, limit, startTs, endTs} = await req.json();
        if (!token || !deviceId || !key) {
        return NextResponse.json({ error: 'Missing required fields: token, deviceId, or key' }, { status: 400 });
        }

        // Build query params
        const params = new URLSearchParams();
        params.append('keys', key);
        if (limit) params.append('limit', limit);
        if (startTs) params.append('startTs', startTs);
        if (endTs) params.append('endTs', endTs); 

        const url = `${TB_BASE_URL}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?${params.toString()}`;
        const res = await fetch(url, {
        method: 'GET',
        headers: {
            'X-Authorization': `Bearer ${token}`,
        },
        });

        const data = await res.json();

        if (!res.ok) {
        return NextResponse.json({ error: data.message || 'Failed to fetch telemetry data' }, { status: res.status });
        }

        return NextResponse.json(data); // returns { [key]: [{ ts: ..., value: ... }, ...] }
    } catch (error) {
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
    }
