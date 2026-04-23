export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'the-ecclesia-secret-key-2024';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, pin } = body;

    if (pin) {
      const student = await prisma.student.findUnique({ where: { pin } });
      if (!student) return NextResponse.json({ message: 'Invalid PIN' }, { status: 401 });

      const token = jwt.sign(
        { userId: student.userId, role: 'STUDENT', studentId: student.id },
        JWT_SECRET, { expiresIn: '7d' }
      );

      return NextResponse.json({
        token,
        user: { role: 'STUDENT', studentId: student.id, classId: student.classId },
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

    if (user.status === 'PENDING') return NextResponse.json({ message: 'Account pending approval' }, { status: 403 });
    if (user.status === 'SUSPENDED') return NextResponse.json({ message: 'Account suspended' }, { status: 403 });

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email, orgUnitId: user.orgUnitId },
      JWT_SECRET, { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ token, user: userWithoutPassword });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
