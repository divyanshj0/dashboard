import { NextResponse } from 'next/server';
const TB_URL = process.env.NEXT_PUBLIC_TB_URL;
export async function POST(req) {
  const { token, userId, enabled } = await req.json(); // 'enabled' here represents userCredentialsEnabled

  if (!token || !userId || typeof enabled === 'undefined') {
    return NextResponse.json({ error: 'Missing required fields: token, userId, or enabled status' }, { status: 400 });
  }
  try {
    const res = await fetch(`${TB_URL}/api/user/${userId}/userCredentialsEnabled?userCredentialsEnabled=${enabled}`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorText;
      } catch (e) {
      }
      return NextResponse.json({ error: `Failed to update user status: ${errorMessage}` }, { status: res.status });
    }

    return NextResponse.json({ success: true, message: `User ${enabled ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    console.error('Toggle user status error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}