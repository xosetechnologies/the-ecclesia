import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'the-ecclesia-secret-key-2024';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, pin } = body;

    // Student PIN login (no email needed)
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

    // Regular login
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

    if (user.role === 'PARENT') {
      const token = jwt.sign(
        { userId: user.id, role: 'PARENT', email: user.email },
        JWT_SECRET, { expiresIn: '7d' }
      );
      return NextResponse.json({ token, user: { role: 'PARENT', userId: user.id } });
    }

    return NextResponse.json({ message: 'Use student PIN or valid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}