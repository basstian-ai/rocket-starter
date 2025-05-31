import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const res = await fetch(`https://dummyjson.com/users/${userId}/carts`);

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ message: 'No orders found for this user or user not found' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Failed to fetch orders' }, { status: res.status });
    }

    const data = await res.json();
    
    if (data.carts && data.carts.length === 0) {
      return NextResponse.json({ message: 'No orders found for this user' }, { status: 404 });
    }


    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Orders data error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
