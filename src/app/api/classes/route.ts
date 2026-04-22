import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'the-ecclesia-secret-key-2024';

function getUserFromToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch { return null; }
}

export async function GET(request: Request) {
  const user = getUserFromToken(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const assemblyId = searchParams.get('assemblyId');
  if (!assemblyId) return NextResponse.json({ message: 'assemblyId required' }, { status: 400 });

  try {
    const classes = await prisma.class.findMany({
      where: { assemblyId },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ classes });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = getUserFromToken(request);
  if (!user || !['NATIONAL_ADMIN', 'REGIONAL_ADMIN', 'DISTRICT_ADMIN', 'ASSEMBLY_ADMIN'].includes(user.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, assemblyId, ageRangeMin, ageRangeMax, description } = body;

    const classItem = await prisma.class.create({
      data: { name, assemblyId, ageRangeMin, ageRangeMax, description },
    });

    return NextResponse.json({ class: classItem });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = getUserFromToken(request);
  if (!user || !['NATIONAL_ADMIN', 'REGIONAL_ADMIN', 'DISTRICT_ADMIN', 'ASSEMBLY_ADMIN'].includes(user.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { classId, ...updateData } = body;

    const updated = await prisma.class.update({
      where: { id: classId },
      data: updateData,
    });

    return NextResponse.json({ class: updated });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = getUserFromToken(request);
  if (!user || !['ASSEMBLY_ADMIN'].includes(user.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');
  if (!classId) return NextResponse.json({ message: 'classId required' }, { status: 400 });

  try {
    await prisma.class.delete({ where: { id: classId } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}