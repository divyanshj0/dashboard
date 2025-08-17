import { NextResponse } from 'next/server';

const TB_URL = process.env.NEXT_PUBLIC_TB_URL;

export async function POST(req) {
    try {
        const { token, userId, telemetrySetup } = await req.json();

        if (!token || !userId) {
            return NextResponse.json({ error: 'Missing token or userId' }, { status: 400 });
        }

        const res = await fetch(`${TB_URL}/api/plugins/telemetry/USER/${userId}/attributes/SERVER_SCOPE`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                telemetrySetup: telemetrySetup,
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            return NextResponse.json({ error: errorText || 'Failed to save telemetry setup' }, { status: res.status });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Save telemetry setup error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}