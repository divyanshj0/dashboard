import { NextResponse } from 'next/server';
const TB = 'https://demo.thingsboard.io';

export async function POST(req) {
  const { token, deviceId } = await req.json();

  const res = await fetch(`${TB}/api/device/${deviceId}`, {
    method: 'DELETE',
    headers: {
      'X-Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    return NextResponse.json({ error: errorText }, { status: res.status });
  }

  return NextResponse.json({ success: true });
}
