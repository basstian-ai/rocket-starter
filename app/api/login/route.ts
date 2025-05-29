import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
    }

    const res = await fetch('https://dummyjson.com/users');
    if (!res.ok) {
      return NextResponse.json({ message: 'Failed to fetch users' }, { status: res.status });
    }

    const data = await res.json();
    const users = data.users;

    const user = users.find((user: any) => user.username === username);

    if (!user) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }

    if (user.password !== password) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
