import { NextResponse } from 'next/server';

const TB_URL = 'https://demo.thingsboard.io';

export async function POST(req) {
  const { token, devices, userId } = await req.json();

  if (!token || !devices || !Array.isArray(devices)) {
    return NextResponse.json({ error: 'missing token/devices' }, { status: 500 });
  }

  try {
    // Get dashboardConfig from user attributes
    const attrRes = await fetch(`${TB_URL}/api/plugins/telemetry/USER/${userId}/values/attributes?keys=dashboardConfig`, {
      headers: { 'X-Authorization': `Bearer ${token}` },
    });

    const attrData = await attrRes.json();
    const configJson = typeof attrData === 'object' && attrData.length ? attrData.find((a) => a.key === 'dashboardConfig')?.value : null;
    const config = typeof configJson === 'string' ? JSON.parse(configJson) : configJson;

    const telemetry = {};

    if (config?.widgets) {
      await Promise.all(
        config.widgets.map(async (widget) => {
          for (const param of widget.parameters || []) {
            const key = param.key;
            const deviceId = param.deviceId;
            const response = await fetch(`${TB_URL}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${key}&limit=20`, {
              headers: { 'X-Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            telemetry[`${deviceId}_${key}`] = data[key] || [];
          }
        })
      );
    }

    return NextResponse.json({
      config,
      layout: config?.layout || [],
      telemetry
    });
  } catch (err) {
    console.error('Error fetching telemetry/config:', err);
    return NextResponse.json({ error: 'Failed to fetch config or layout' }, { status: 500 });
  }
}