import { NextResponse } from 'next/server';

const TB_URL = 'https://demo.thingsboard.io';

export async function POST(req) {
  const { token, pageSize = 100, page = 0, includeSystemImages = false } = await req.json();

  if (!token) {
    return NextResponse.json({ error: 'Authentication token missing.' }, { status: 401 });
  }

  try {
    const params = new URLSearchParams();
    params.append('pageSize', pageSize);
    params.append('page', page);
    params.append('includeSystemImages', includeSystemImages);
    const res = await fetch(`${TB_URL}/api/images?${params.toString()}`, {
      method: 'GET', 
      headers: {
        'X-Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: `Failed to fetch images: ${errorText}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data.data || []);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ error: 'Server error fetching images.' }, { status: 500 });
  }
}