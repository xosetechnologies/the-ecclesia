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
  if (!user || user.role !== 'DISTRICT_ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orgUnitId = user.orgUnitId;
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const assemblies = await prisma.localAssembly.findMany({
      where: { organizationId: orgUnitId },
    });

    const classes = await prisma.class.findMany({
      where: { assemblyId: { in: assemblies.map(a => a.id) } },
    });

    const totalStudents = await prisma.student.count({
      where: { classId: { in: classes.map(c => c.id) } },
    });

    const totalTeachers = await prisma.teacher.count({
      where: { assemblyId: { in: assemblies.map(a => a.id) } },
    });

    const attendance = await prisma.attendance.count({
      where: { classId: { in: classes.map(c => c.id) }, date: { gte: monthAgo } },
    });

    const present = await prisma.attendance.count({
      where: { classId: { in: classes.map(c => c.id) }, date: { gte: monthAgo }, status: 'PRESENT' as any },
    });

    return NextResponse.json({
      totalAssemblies: assemblies.length,
      totalStudents,
      totalTeachers,
      attendanceRate: attendance > 0 ? Math.round((present / attendance) * 100) : 0,
      assemblies,
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
