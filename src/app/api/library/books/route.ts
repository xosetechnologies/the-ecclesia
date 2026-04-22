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
  const assemblyId = searchParams.get('assemblyId');
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  try {
    const where: any = { status: 'ACTIVE' };
    if (assemblyId) where.assemblyId = assemblyId;
    if (category) where.category = category;
    if (search) where.OR = [
      { title: { contains: search } },
      { author: { contains: search } },
    ];

    const books = await prisma.book.findMany({
      where,
      orderBy: { title: 'asc' },
    });

    return NextResponse.json({ books });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = getUserFromToken(request);
  if (!user || !['ASSEMBLY_ADMIN'].includes(user.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, author, category, description, coverImage, isbn, totalCopies, digitalAvailable, assemblyId } = body;

    const book = await prisma.book.create({
      data: {
        title, author, category, description, coverImage, isbn,
        totalCopies: totalCopies || 1,
        digitalAvailable: digitalAvailable || false,
        status: 'ACTIVE',
      },
    });

    for (let i = 1; i <= (totalCopies || 1); i++) {
      await prisma.bookCopy.create({
        data: { bookId: book.id, copyNumber: i, condition: 'GOOD', status: 'AVAILABLE' },
      });
    }

    return NextResponse.json({ book });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = getUserFromToken(request);
  if (!user || !['ASSEMBLY_ADMIN'].includes(user.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bookId, ...updateData } = body;

    const book = await prisma.book.update({
      where: { id: bookId },
      data: updateData,
    });

    return NextResponse.json({ book });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}