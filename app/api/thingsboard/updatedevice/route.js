import { NextResponse } from 'next/server';

const TB_URL = process.env.NEXT_PUBLIC_TB_URL;

export async function POST(req) {
  try {
    const { token, customerId, deviceId, name, label, clientId, username, password } = await req.json();
    let updatedDeviceRes;
    let updatedDeviceData;

    if (clientId || username || password) {
      updatedDeviceRes = await fetch(`${TB_URL}/api/device-with-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          device: {
            id: { id: deviceId, entityType: 'DEVICE' },
            name: name,
            label: label
          },
          credentials: {
            credentialsType: 'MQTT_BASIC',
            credentialsValue: JSON.stringify({
              clientId: clientId || '',
              userName: username || '',
              password: password || '',
            })
          }
        }),
      });

      updatedDeviceData = await updatedDeviceRes.json();

      if (!updatedDeviceRes.ok) {
        return NextResponse.json({ error: updatedDeviceData.message || 'Failed to update device credentials' }, { status: updatedDeviceRes.status });
      }
    } else {
      if (!token || !deviceId) {
        return NextResponse.json({ error: 'Missing required fields: token or deviceId' }, { status: 400 });
      }
      updatedDeviceRes = await fetch(`${TB_URL}/api/device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: { id: deviceId, entityType: 'DEVICE' },
          name,
          label
        }),
      });

      updatedDeviceData = await updatedDeviceRes.json();
      if (!updatedDeviceRes.ok) {
        return NextResponse.json({ error: updatedDeviceData.message || 'Failed to update device basic info' }, { status: updatedDeviceRes.status });
      }
    }

    const assignRes = await fetch(`${TB_URL}/api/customer/${customerId}/device/${updatedDeviceData.id.id}`, {
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

    return NextResponse.json(updatedDeviceData);

  } catch (error) {
    console.error('Update device error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}