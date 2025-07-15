import { NextResponse } from 'next/server';

const TB = 'https://demo.thingsboard.io';

export async function POST(req) {
  const { token, customerId } = await req.json();

  const pageSize = 100;
  let page = 0;
  let allUsers = [];
  let hasNext = true;

  try {
    while (hasNext) {
      const res = await fetch(`${TB}/api/customer/${customerId}/users?pageSize=${pageSize}&page=${page}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error fetching users: ${res.status} ${res.statusText}`);
        console.error('Response body:', errorText);
        throw new Error(`Failed to fetch users: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      allUsers = allUsers.concat(data.data || []);
      hasNext = data.hasNext;
      page++;
    }

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error('Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
