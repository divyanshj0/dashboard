import { NextResponse } from 'next/server';

const TB_URL = 'https://demo.thingsboard.io';

export async function POST(req) {
  try {
    const { token,customerId, deviceId, name, label, clientId, username, password } = await req.json();
    let credentialsUpdateRes;
    let credentialsUpdateData;
    if (clientId || username || password) {
      credentialsUpdateRes = await fetch(`${TB_URL}/api/device-with-credentials`, {
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

      credentialsUpdateData = await credentialsUpdateRes.json();

      if (!credentialsUpdateRes.ok) {
        return NextResponse.json({ error: credentialsUpdateData.message || 'Failed to update device credentials' }, { status: credentialsUpdateRes.status });
      }
    }
    else {
      if (!token || !deviceId) {
        return NextResponse.json({ error: 'Missing required fields: token or deviceId' }, { status: 400 });
      }
      credentialsUpdateRes = await fetch(`${TB_URL}/api/device`, {
        method: 'POST', // Use PUT for updating device
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

      credentialsUpdateData = await credentialsUpdateRes.json();
      if (!deviceUpdateRes.ok) {
        return NextResponse.json({ error: deviceUpdateData.message || 'Failed to update device basic info' }, { status: deviceUpdateRes.status });
      }
    }
    const assignRes = await fetch(`${TB}/api/customer/${customerId}/device/${credentialsUpdateData.id.id}`, {
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
    console.error('Update device error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}