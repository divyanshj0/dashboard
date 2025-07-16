import { NextResponse } from 'next/server';
const TB = 'https://demo.thingsboard.io';

export async function POST(req) {
  const { token, customerId, email, firstName, lastName } = await req.json();

  const res = await fetch(`${TB}/api/user?sendActivationMail=true`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      authority: 'CUSTOMER_USER',
      customerId,
      email,
      firstName,
      lastName,
    }),
  });

  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data.message }, { status: res.status });
  return NextResponse.json(data);
}
