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
        console.error(`Error fetching users from customer: ${res.status} ${res.statusText}`);
        console.error('Response body:', errorText);
        throw new Error(`Failed to fetch users from customer: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      allUsers = allUsers.concat(data.data || []);
      hasNext = data.hasNext;
      page++;
    }

    // Now, for each user, fetch their detailed info to get the 'enabled' status
    const usersWithStatus = await Promise.all(
      allUsers.map(async (user) => {
        try {
          const userDetailRes = await fetch(`${TB}/api/user/${user.id.id}`, {
            headers: {
              'Content-Type': 'application/json',
              'X-Authorization': `Bearer ${token}`,
            },
          });

          if (!userDetailRes.ok) {
            console.error(`Failed to fetch details for user ${user.id.id}: ${userDetailRes.status} ${userDetailRes.statusText}`);
            return { ...user, enabled: true };
          }
          const userDetails = await userDetailRes.json();
          return { ...user, enabled: userDetails.additionalInfo.userCredentialsEnabled};
        } catch (detailError) {
          console.error(`Exception fetching details for user ${user.id.id}:`, detailError);
          return { ...user, enabled: false }; // Default to disabled on exception
        }
      })
    );

    return NextResponse.json(usersWithStatus);
  } catch (error) {
    console.error('Exception in getcustomeruser:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}