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
  const classId = searchParams.get('classId');
  const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

  if (!classId) return NextResponse.json({ message: 'classId required' }, { status: 400 });

  try {
    const attendanceDate = new Date(dateStr);
    
    const students = await prisma.student.findMany({
      where: { classId, status: 'ACTIVE' as any },
    });

    const attendanceRecords = await prisma.attendance.findMany({
      where: { classId, date: attendanceDate },
    });

    const markedIds = new Set(attendanceRecords.map((a: any) => a.studentId));
    const marked = students.filter((s: any) => markedIds.has(s.id));
    const unmarked = students.filter((s: any) => !markedIds.has(s.id));

    return NextResponse.json({ marked, unmarked });
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
    const { records, date, classId } = body;
    const attendanceDate = new Date(date);

    for (const record of records) {
      const existing = await prisma.attendance.findFirst({
        where: { 
          studentId: record.studentId,
          classId,
          date: attendanceDate,
        },
      });

      if (existing) {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: { status: record.status, recordedBy: user.userId as string },
        });
      } else {
        await prisma.attendance.create({
          data: {
            studentId: record.studentId,
            classId,
            date: attendanceDate,
            status: record.status,
            recordedBy: user.userId as string,
          },
        });
      }
    }

    return NextResponse.json({ message: 'Attendance saved' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}