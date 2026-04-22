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

function generateSecurityCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

export async function GET(request: Request) {
  const user = getUserFromToken(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const checkInDate = new Date(date);
    checkInDate.setHours(0, 0, 0, 0);
    
    const checkedIn = await prisma.checkInRecord.findMany({
      where: { date: checkInDate },
    });

    return NextResponse.json({ checkedIn: checkedIn.length });
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
    const { studentId, action } = body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (action === 'checkin') {
      const existing = await prisma.checkInRecord.findFirst({
        where: { studentId: studentId, date: today },
      });

      if (existing && !existing.checkOutTime) {
        return NextResponse.json({ message: 'Already checked in' }, { status: 400 });
      }

      const securityCode = generateSecurityCode();
      
      const record = await prisma.checkInRecord.create({
        data: {
          studentId: studentId,
          date: today,
          checkInTime: new Date(),
          securityCode: securityCode,
        },
      });

      return NextResponse.json({ record, securityCode });
    }

    if (action === 'checkout') {
      const record = await prisma.checkInRecord.findFirst({
        where: { studentId: studentId, date: today },
      });

      if (!record || record.checkOutTime) {
        return NextResponse.json({ message: 'Not checked in' }, { status: 400 });
      }

      await prisma.checkInRecord.update({
        where: { id: record.id },
        data: { checkOutTime: new Date() },
      });

      return NextResponse.json({ message: 'Checked out' });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}