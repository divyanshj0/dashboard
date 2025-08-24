import { NextResponse } from 'next/server';

const TB_URL = process.env.NEXT_PUBLIC_TB_URL;

export async function POST(req) {
  try {
    const { token, customerId, pageSize = 100, page = 0 } = await req.json();

    if (!token || !customerId) {
      return NextResponse.json({ error: 'Missing required data: token or customerId' }, { status: 400 });
    }

    const url = `${TB_URL}/api/alarm/CUSTOMER/${customerId}?searchStatus=ACTIVE&pageSize=100&page=0`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Authorization': `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: `Failed to fetch alarms: ${errorText}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Fetch alarms error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}