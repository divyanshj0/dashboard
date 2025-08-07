import { NextResponse } from 'next/server'

const TB_URL = process.env.NEXT_PUBLIC_TB_URL

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    // User logs in with their own email/password
    const loginRes = await fetch(`${TB_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password }),
    })
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      return NextResponse.json(loginData, {status:loginRes.status});
    }

    const { token } = loginData;

    const userRes = await fetch(`${TB_URL}/api/auth/user`, {
      headers: {
        'X-Authorization': `Bearer ${token}`
      }
    })
    const userData = await userRes.json();

    if (!userRes.ok) {
      return NextResponse.json(userData, {status:userRes.status});
    }

    const user = userData;
    const customerId = user.customerId.id
    const userId=user.id.id
    const userName=user.firstName +" "+user.lastName
    const userAuthority = user.authority
    return NextResponse.json({
      token,
      userId,
      customerId,
      userName,
      userAuthority
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 })
  }
}