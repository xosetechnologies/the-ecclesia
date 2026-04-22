import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'the-ecclesia-secret-key-2024';

function getUserFromToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch { return null; }
}

export async function GET(request: Request) {
  const user = getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const chapters = await prisma.organizationUnit.findMany({
      where: { type: 'NATIONAL' },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ chapters });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}