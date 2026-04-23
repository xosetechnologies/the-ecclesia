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
  const type = searchParams.get('type') || 'attendance';
  const classId = searchParams.get('classId');
  const format = searchParams.get('format');

  try {
    let data: any[] = [];
    let headers: string[] = [];

    if (type === 'attendance') {
      const where: any = {};
      if (classId) where.classId = classId;
      
      const records = await prisma.attendance.findMany({
        where,
        take: 1000,
        orderBy: { date: 'desc' },
      });
      
      data = records.map(r => ({
        StudentId: r.studentId,
        ClassId: r.classId,
        Date: new Date(r.date).toLocaleDateString(),
        Status: r.status,
      }));
      headers = ['StudentId', 'ClassId', 'Date', 'Status'];
    }

    else if (type === 'students') {
      const where: any = {};
      if (classId) where.classId = classId;

      const students = await prisma.student.findMany({
        where,
        take: 1000,
        orderBy: { enrollmentDate: 'desc' },
      });

      data = students.map(s => ({
        ID: s.id,
        ClassId: s.classId || 'Unassigned',
        ParentPhone: s.parentPhone || '',
        EnrollmentDate: new Date(s.enrollmentDate).toLocaleDateString(),
      }));
      headers = ['ID', 'ClassId', 'ParentPhone', 'EnrollmentDate'];
    }

    if (format === 'csv' && data.length > 0) {
      const csvRows = [headers.join(','), ...data.map(row => headers.map(h => String(row[h] || '')).join(','))];
      const csv = csvRows.join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}_report.csv"`,
        },
      });
    }

    return NextResponse.json({ type, headers, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
