import { NextResponse } from 'next/server';

const TB_URL = 'https://demo.thingsboard.io';

export async function POST(req) {
  try {
    const { token, userId, config } = await req.json();

    // Step 1: Fetch existing dashboardConfig attribute
    const existingRes = await fetch(`${TB_URL}/api/plugins/telemetry/USER/${userId}/values/attributes?scope=SERVER_SCOPE`, {
      headers: {
        'X-Authorization': `Bearer ${token}`
      }
    });

    const existingAttr = await existingRes.json();
    const existingCfgAttr = existingAttr.find(a => a.key === 'dashboardConfig');
    const oldConfig = existingCfgAttr?.value || {}; // already a JSON object

    // Step 2: Merge new config with oldConfig by matching label
    const mergedConfig = { ...oldConfig };

    for (const section in config) {
      if (!mergedConfig[section]) mergedConfig[section] = [];

      config[section].forEach(newItem => {
        const index = mergedConfig[section].findIndex(
          item => item.label === newItem.label
        );

        if (index >= 0) {
          // Update existing item
          mergedConfig[section][index] = { ...mergedConfig[section][index], ...newItem };
        } else {
          // Add new item
          mergedConfig[section].push(newItem);
        }
      });
    }

    // Step 3: Save merged config back to ThingsBoard as object
    await fetch(`${TB_URL}/api/plugins/telemetry/USER/${userId}/attributes/SERVER_SCOPE`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        dashboardConfig: mergedConfig // ✅ DO NOT JSON.stringify this
      })
    });

    return NextResponse.json({ status: 'ok' });

  } catch (err) {
    console.error('Error saving dashboard config:', err);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
