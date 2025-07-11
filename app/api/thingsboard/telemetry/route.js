import { NextResponse } from 'next/server';
const TB_URL = 'https://demo.thingsboard.io';
export async function POST(req) {
  const { token, devices,userId } = await req.json();

  if (!token || !devices || !Array.isArray(devices)) {
    return NextResponse.json({ error: 'missing token/devices' }, { status: 500 });
  }

  try {
    // Step 1: Fetch dashboardConfig from user attributes
    const attrRes = await fetch(`${TB_URL}/api/plugins/telemetry/USER/${userId}/values/attributes?keys=dashboardConfig`,{
        headers: { 'X-Authorization': `Bearer ${token}`,},
      });

    const attrData = await attrRes.json();
    const dashboardConfigAttr = attrData.find((a) => a.key === 'dashboardConfig');
    const config = dashboardConfigAttr?.value || null;

    // Step 2: Fetch latest telemetry for each widget
    const telemetry = {};
    if (config?.widgets) {
      await Promise.all(
        config.widgets.map(async (w) => {
          const devId = w.deviceId;
          const key = w.key;

          const tsRes = await fetch(`${TB_URL}/api/plugins/telemetry/DEVICE/${devId}/values/timeseries?keys=${key}&limit=1`, {
            headers: {
              'X-Authorization': `Bearer ${token}`,
            },
          });

          const tsData = await tsRes.json();
          telemetry[`${devId}_${key}`] = tsData[key]?.[0]?.value || null;
        })
      );
    }

      return NextResponse.json({ config:config,layout: config?.layout || [],telemetry:telemetry, });
  } catch (err) {
    console.error('Error fetching telemetry/config:', err);
    return NextResponse.json({ error: 'Failed to fetch config or layout' }, { status: 500 });
  }
}
