import { NextResponse } from 'next/server';

const TB_URL = process.env.NEXT_PUBLIC_TB_URL;

export async function POST(req) {
  try {
    const { customerId, token } = await req.json();

    // 1. Fetch devices for the customer
    const devicesRes = await fetch(`${TB_URL}/api/customer/${customerId}/deviceInfos?pageSize=100&page=0`, {
      headers: { 'X-Authorization': `Bearer ${token}` },
    });

    if (!devicesRes.ok) {
      const text = await devicesRes.text();
      return NextResponse.json({ error: 'Failed to fetch devices: ' + text }, { status: 400 });
    }

    const devicesJson = await devicesRes.json();
    const devices = devicesJson.data || [];

    // 2. Fetch credentials for each device
    const devicesWithCredentials = await Promise.all(
      devices.map(async (device) => {
        try {
          const credRes = await fetch(`${TB_URL}/api/device/${device.id.id}/credentials`, {
            headers: { 'X-Authorization': `Bearer ${token}` },
          });

          const credentials = await credRes.json();

          // Add credentials under new key
          return {
            ...device,
            credentials,
          };
        } catch (credErr) {
          // If credential fetch fails, log and return device without credentials
          console.warn('Failed to fetch credentials for device:', device.name);
          return {
            ...device,
            credentials: null,
          };
        }
      })
    );

    // 3. Return the response
    return NextResponse.json({
      devices: devicesWithCredentials,
    });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
