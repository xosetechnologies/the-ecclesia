export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'the-ecclesia-secret-key-2024';

function getUserFromToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try { return jwt.verify(token, JWT_SECRET) as { userId: string; role: string }; }
  catch { return null; }
}

export async function GET(request: Request) {
  const user = getUserFromToken(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');
  const status = searchParams.get('status');

  try {
    const where: any = {};
    if (classId) where.targetClassId = classId;
    if (status) where.status = status;
    else where.status = 'PUBLISHED';

    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ lessons });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = getUserFromToken(request);
  if (!user || !['ASSEMBLY_ADMIN', 'TEACHER'].includes(user.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, topic, targetClassId, description, coverImage, availabilityDate, status } = body;

    const lesson = await prisma.lesson.create({
      data: {
        title, topic, targetClassId, description, coverImage,
        availabilityDate: new Date(availabilityDate),
        status: status || 'DRAFT',
      },
    });

    return NextResponse.json({ lesson });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
