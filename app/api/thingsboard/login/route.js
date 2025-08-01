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

    if (!loginRes.ok) throw new Error('Login failed')

    const { token } = await loginRes.json()

    const userRes = await fetch(`${TB_URL}/api/auth/user`, {
      headers: {
        'X-Authorization': `Bearer ${token}`
      }
    })

    if (!userRes.ok) throw new Error('User fetch failed')

    const user = await userRes.json()
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
