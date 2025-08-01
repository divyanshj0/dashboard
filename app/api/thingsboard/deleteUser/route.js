import { NextResponse } from 'next/server';
const TB =process.env.NEXT_PUBLIC_TB_URL

export async function POST(req) {
  const { token, userId } = await req.json();

  const res = await fetch(`${TB}/api/user/${userId}`, {
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
