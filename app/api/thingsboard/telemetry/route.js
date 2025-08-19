import { NextResponse } from 'next/server';

const TB_URL = process.env.NEXT_PUBLIC_TB_URL;

export async function POST(req) {
  const { token, userId,key } = await req.json();

  if (!token) {
    return NextResponse.json({ error: 'missing token' }, { status: 500 });
  }

  try {
    // Get dashboardConfig from user attributes
    const attrRes = await fetch(`${TB_URL}/api/plugins/telemetry/USER/${userId}/values/attributes?keys=${key}`, {
      headers: { 'X-Authorization': `Bearer ${token}` },
    });

    const attrData = await attrRes.json();
    if (key==='telemetrySetup'){
      return NextResponse.json(attrData.length ?attrData.find((a) => a.key === key)?.value:null);
    }
    const configJson = typeof attrData === 'object' && attrData.length ? attrData.find((a) => a.key === key)?.value : null;
    const config = typeof configJson === 'string' ? JSON.parse(configJson) : configJson;
    if (!attrRes.ok){
     return NextResponse.json(attrData, {status:attrData.status})
    }

    return NextResponse.json({
      config,
      layout: config?.layout || [],
    });
  } catch (err) {
    console.error('Error fetching telemetry/config:', err);
    return NextResponse.json({ error: 'Failed to fetch config or layout' }, { status: 500 });
  }
}