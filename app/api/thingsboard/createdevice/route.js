import { NextResponse } from 'next/server';
const TB = 'https://demo.thingsboard.io';

export async function POST(req) {
  const { token, customerId, name, label} = await req.json();

  const res = await fetch(`${TB}/api/device`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: name,
      label: label
    }),
  });

  const device = await res.json();
  if (!res.ok) return NextResponse.json({ error: device.message }, { status: res.status });

  const res2 = await fetch(`${TB}/api/customer/${customerId}/device/${device.id.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${token}`, 
    }
  });
  const deviceData = await res2.json();
  if (!res2.ok) return NextResponse.json({ error: deviceData.message }, { status: res2.status });
  return NextResponse.json(device);
}
