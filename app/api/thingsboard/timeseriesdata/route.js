    import { NextResponse } from 'next/server';
    const TB_BASE_URL = 'https://demo.thingsboard.io';
    export async function POST(req) {
    try {
        const {token, deviceId, key, limit = 50, startTs, endTs, interval} = await req.json();
        if (!token || !deviceId || !key) {
        return NextResponse.json({ error: 'Missing required fields: token, deviceId, or key' }, { status: 400 });
        }

        // Build query params
        const params = new URLSearchParams();
        params.append('keys', key);
        if (limit) params.append('limit', limit);
        if (startTs) params.append('startTs', startTs);
        if (endTs) params.append('endTs', endTs);
        if (interval) params.append('interval', interval); // e.g. 60000 ms for 1-minute aggregation

        const url = `${TB_BASE_URL}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?${params.toString()}`;
        console.log('Fetching telemetry data from:', url);
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
