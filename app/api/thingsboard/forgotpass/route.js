const TB_URL = 'https://demo.thingsboard.io'

export async function POST(req) {
  try {
    const { email } = await req.json()

    const forgotRes = await fetch(`${TB_URL}/api/noauth/resetPasswordByEmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (!forgotRes.ok) {
      const errorText = await forgotRes.text()
      return new Response(JSON.stringify({ error: errorText || 'Password reset failed' }), { status: 400 })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })

  } catch (err) {
    console.error('Password reset error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500 })
  }
}
