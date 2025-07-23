import { NextResponse } from 'next/server';
const TB = 'https://demo.thingsboard.io';

export async function POST(req) {
  try {
    const { token, customerId, name, label, clientId, username, password } = await req.json();
    console.log(token, customerId, name, label, clientId, username, password );
    let createdDeviceRes;
    let device;

    // 1. Check if clientId is provided (create with credentials or not)
    if (!clientId || clientId.trim() === '') {
      // 👉 No credentials — use basic /api/device call 
      createdDeviceRes = await fetch(`${TB}/api/device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, label }),
      });

    } else {
      // 👉 Use device-with-credentials
      createdDeviceRes = await fetch(`${TB}/api/device-with-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          device: { name, label },
          credentials: {
            credentialsType: 'MQTT_BASIC',
            credentialsValue: JSON.stringify({
              clientId,
              userName: username,
              password: password,
            }),
          },
        }),
      });
    }

    // Parse response from device creation
    device = await createdDeviceRes.json();

    if (!createdDeviceRes.ok) {
      return NextResponse.json({ error: device.message || 'Failed to create device' }, { status: createdDeviceRes.status });
    }

    // 2. Assign device to customer
    const assignRes = await fetch(`${TB}/api/customer/${customerId}/device/${device.id.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
    });

    const assignResult = await assignRes.json();

    if (!assignRes.ok) {
      return NextResponse.json({ error: assignResult.message || 'Failed to assign device to customer' }, { status: assignRes.status });
    }

    // 3. Return device response
    return NextResponse.json(device);

  } catch (error) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
