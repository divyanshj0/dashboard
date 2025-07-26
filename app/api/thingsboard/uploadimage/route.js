import { NextResponse } from 'next/server';

const TB_URL = 'https://demo.thingsboard.io';

export async function POST(req) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader ? authHeader.split(' ')[1] : null;

  if (!token) {
    return NextResponse.json({ error: 'Authentication token missing.' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const res = await fetch(`${TB_URL}/api/image`, {
      method: 'POST',
      headers: {
        'X-Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: `Failed to upload image: ${errorText}` }, { status: res.status });
    }
    const uploadedImage = await res.json();
    return NextResponse.json(uploadedImage);
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Server error uploading image.' }, { status: 500 });
  }
}

// Crucial for Next.js to parse the request body as FormData
export const config = {
  api: {
    bodyParser: false,
  },
};