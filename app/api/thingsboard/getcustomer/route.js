import { NextResponse } from 'next/server';
const TB = 'https://demo.thingsboard.io';

export async function POST(req) {
  const { token } = await req.json();

  let page = 0;
  const pageSize = 100;
  let allCustomers = [];
  let hasNext = true;

  try {
    while (hasNext) {
      const res = await fetch(`${TB}/api/customers?pageSize=${pageSize}&page=${page}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error fetching customers: ${res.status} ${res.statusText}`);
        console.error('Response body:', errorText);
        throw new Error(`Failed to fetch customer info: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      allCustomers = allCustomers.concat(data.data || []);
      hasNext = data.hasNext;
      page++;
    }
    console.log('Fetched customers:', allCustomers);
    return NextResponse.json(allCustomers);
  } catch (error) {
    console.error('Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
