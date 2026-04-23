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
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string; orgUnitId?: string };
  } catch { return null; }
}

export async function GET(request: Request) {
  const user = getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let whereClause = {};
    
    if (user.role === 'NATIONAL_ADMIN' && user.orgUnitId) {
      whereClause = { organizationId: user.orgUnitId };
    } else if (user.role === 'REGIONAL_ADMIN' && user.orgUnitId) {
      whereClause = { organizationId: user.orgUnitId };
    }

    const [totalAssemblies, totalStudents, totalTeachers, thisWeekAttendance, presentCount] = await Promise.all([
      prisma.localAssembly.count({ where: whereClause }),
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.attendance.count({
        where: { date: { gte: weekAgo } },
      }),
      prisma.attendance.count({
        where: { date: { gte: weekAgo }, status: 'PRESENT' as any },
      }),
    ]);

    const attendanceRate = thisWeekAttendance > 0 
      ? Math.round((presentCount / thisWeekAttendance) * 100) 
      : 0;

    return NextResponse.json({
      totalAssemblies,
      totalStudents,
      totalTeachers,
      attendanceRate,
      thisWeekAttendance: presentCount,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
