export const dynamic = 'force-dynamic';

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
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // AVAILABLE, BORROWED, OVERDUE

  try {
    const where: any = {};
    if (status === 'OVERDUE') {
      where.returnDate = null;
      where.dueDate = { lt: new Date() };
    }

    const records = await prisma.borrowingRecord.findMany({
      where,
      orderBy: { checkoutDate: 'desc' },
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error(error);
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
    const { bookId, borrowerId, borrowerType, dueDate } = body;

    const availableCopy = await prisma.bookCopy.findFirst({
      where: { bookId, status: 'AVAILABLE' },
    });

    if (!availableCopy) {
      return NextResponse.json({ message: 'No copies available' }, { status: 400 });
    }

    const record = await prisma.borrowingRecord.create({
      data: {
        copyId: availableCopy.id,
        borrowerId,
        borrowerType,
        checkoutDate: new Date(),
        dueDate: new Date(dueDate),
      },
    });

    await prisma.bookCopy.update({
      where: { id: availableCopy.id },
      data: { status: 'BORROWED' },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = getUserFromToken(request);
  if (!user || !['ASSEMBLY_ADMIN', 'TEACHER'].includes(user.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { recordId, copyId } = body;

    await prisma.borrowingRecord.update({
      where: { id: recordId },
      data: { returnDate: new Date(), fineAmount: 0, finePaid: false },
    });

    await prisma.bookCopy.update({
      where: { id: copyId },
      data: { status: 'AVAILABLE' },
    });

    return NextResponse.json({ message: 'Book returned' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
