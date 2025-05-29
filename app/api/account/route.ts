import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const res = await fetch(`https://dummyjson.com/users/${userId}`);

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Failed to fetch user data' }, { status: res.status });
    }

    const user = await res.json();

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
      age: user.age,
      gender: user.gender,
      phone: user.phone,
      birthDate: user.birthDate,
      university: user.university,
      address: user.address,
      macAddress: user.macAddress,
      ip: user.ip,
    }, { status: 200 });

  } catch (error) {
    console.error('Account data error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
