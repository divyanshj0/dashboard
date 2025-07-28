import { NextResponse } from 'next/server';
const TB = 'https://demo.thingsboard.io';

export async function POST(req) {
  try {
    const { token, customerId, email, firstName, lastName, password } = await req.json();

    // Create user
    const res = await fetch(`${TB}/api/user?sendActivationMail=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        customerId: {
          id: customerId,
          entityType: "CUSTOMER"
        },
        email,
        authority: "CUSTOMER_USER",
        firstName,
        lastName,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json({ error: errorData.message || 'User creation failed' }, { status: res.status });
    }
    const user = await res.json();

    // Get activation link (response is plain text)
    const res2 = await fetch(`${TB}/api/user/${user.id.id}/activationLink`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
    });

    if (!res2.ok) {
      const errorText = await res2.text();
      return NextResponse.json({ error: errorText || 'Failed to get activation link' }, { status: res2.status });
    }

    const url = await res2.text();
    const parsedUrl = new URL(url);
    const activationToken = parsedUrl.searchParams.get('activateToken');

    // Activate user (assuming POST with JSON body accepted by your server)
    const res3 = await fetch(`${TB}/api/noauth/activate?sendActivationMail=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        activateToken: activationToken,
        password,
      }),
    });

    if (!res3.ok) {
      const errorData = await res3.json().catch(() => ({}));
      return NextResponse.json({ error: errorData.message || 'Activation failed' }, { status: res3.status });
    }

    return NextResponse.json(user);
  } catch (error) {
    // Catch all unexpected errors
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}
