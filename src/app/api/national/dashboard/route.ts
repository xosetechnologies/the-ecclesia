export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'the-ecclesia-secret-key-2024';

function getUserFromToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try { return jwt.verify(token, JWT_SECRET) as { userId: string; role: string; orgUnitId?: string }; }
  catch { return null; }
}

export async function GET(request: Request) {
  const user = getUserFromToken(request);
  if (!user || user.role !== 'NATIONAL_ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orgUnitId = user.orgUnitId;
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const assemblies = await prisma.localAssembly.findMany({
      where: { organizationId: orgUnitId },
    });

    const classCount = await prisma.class.count({
      where: { assemblyId: { in: assemblies.map(a => a.id) } },
    });

    const totalStudents = await prisma.student.count({});
    const totalTeachers = await prisma.teacher.count({});
    const thisMonthAttendance = await prisma.attendance.count({
      where: { date: { gte: monthAgo } },
    });

    const presentCount = await prisma.attendance.count({
      where: { date: { gte: monthAgo }, status: 'PRESENT' as any },
    });

    const insight = thisMonthAttendance > 0 
      ? `Attendance is ${Math.round((presentCount / thisMonthAttendance) * 100)}% this month across ${assemblies.length} assemblies.`
      : 'No attendance data this month.';

    return NextResponse.json({
      totalAssemblies: assemblies.length,
      totalStudents,
      totalTeachers,
      attendanceRate: thisMonthAttendance > 0 ? Math.round((presentCount / thisMonthAttendance) * 100) : 0,
      regionalStats: [],
      insight,
      assemblies,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
