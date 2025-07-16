import { NextResponse } from 'next/server'

const TB_URL = 'https://demo.thingsboard.io'

export async function POST(req) {
  try {
    const { customerId,token } = await req.json()
    // ✅ Use the user's own token to fetch customer devices
    const devicesRes = await fetch(`${TB_URL}/api/customer/${customerId}/deviceInfos?pageSize=100&page=0`, {
      headers: { 'X-Authorization': `Bearer ${token}` },
    })

    if (!devicesRes.ok) {
      const text = await devicesRes.text()
      return NextResponse.json({ error: 'Failed to fetch devices: ' + text }, { status: 400 })
    }

    const { data: devices } = await devicesRes.json()

    return NextResponse.json({
      devices
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 })
  }
}
