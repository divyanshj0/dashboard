import { NextResponse } from 'next/server';
const TB = process.env.NEXT_PUBLIC_TB_URL;

export async function POST(req) {
  const { token } = await req.json();

  try {
    // Fetch all customers
    const customerRes = await fetch(`${TB}/api/customers?pageSize=1000&page=0`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
      },
    });

    if (!customerRes.ok) {
      const err = await customerRes.text();
      console.error('Failed to fetch customers:', err);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    const customerData = await customerRes.json();
    const customers = customerData.data || [];

    // Fetch users for each customer
    const customersWithUsers = await Promise.all(
      customers.map(async (customer) => {
        try {
          const userRes = await fetch(`${TB}/api/customer/${customer.id.id}/users?pageSize=1000&page=0`, {
            headers: {
              'Content-Type': 'application/json',
              'X-Authorization': `Bearer ${token}`,
            },
          });

          const userData = await userRes.json();
          return { ...customer, users: userData.data || [] };
        } catch (error) {
          console.error(`Failed to fetch users for customer ${customer.title}:`, error);
          return { ...customer, users: [] };
        }
      })
    );

    return NextResponse.json(customersWithUsers);
  } catch (error) {
    console.error('Exception in getcustomer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
