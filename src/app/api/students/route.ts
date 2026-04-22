import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'the-ecclesia-secret-key-2024';

function getUserFromToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try { return jwt.verify(token, JWT_SECRET) as { userId: string; role: string }; } 
  catch { return null; }
}

export async function GET(request: Request) {
  const user = getUserFromToken(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');
  const assemblyId = searchParams.get('assemblyId');

  try {
    const where: any = {};
    if (classId) where.classId = classId;
    if (assemblyId) where.class = { assemblyId: assemblyId };

    const students = await prisma.student.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ students });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = getUserFromToken(request);
  if (!user || !['NATIONAL_ADMIN', 'REGIONAL_ADMIN', 'DISTRICT_ADMIN', 'ASSEMBLY_ADMIN', 'TEACHER'].includes(user.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { firstName, lastName, email, classId, assemblyId, dateOfBirth, gender, parentPhone, createParentAccount } = body;

    const hashedPassword = await bcrypt.hash('student123', 10);

    const studentUser = await prisma.user.create({
      data: {
        email: email || `${Date.now()}@student.ecclesia`,
        password: hashedPassword,
        firstName,
        lastName,
        phone: parentPhone,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });

    const pin = Math.random().toString(36).slice(-4).toUpperCase();

    const student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        classId,
        pin,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        parentPhone,
        enrollmentDate: new Date(),
        status: 'ACTIVE',
      },
    });

    if (createParentAccount && parentPhone) {
      const parentPassword = await bcrypt.hash('parent123', 10);
      const parentUser = await prisma.user.create({
        data: {
          email: `parent_${parentPhone}@ecclesia`,
          password: parentPassword,
          firstName: 'Parent',
          lastName: lastName,
          phone: parentPhone,
          role: 'PARENT',
          status: 'ACTIVE',
        },
      });
    }

    return NextResponse.json({ student, pin });
  } catch (error) {
    console.error('Student create error:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = getUserFromToken(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { studentId, classId, firstName, lastName, dateOfBirth, gender, parentPhone } = body;

    if (classId) {
      await prisma.student.update({
        where: { id: studentId },
        data: { classId },
      });
    }

    if (firstName || lastName) {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (student) {
        await prisma.user.update({
          where: { id: student.userId },
          data: { firstName: firstName || undefined, lastName: lastName || undefined },
        });
      }
    }

    return NextResponse.json({ message: 'Updated' });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = getUserFromToken(request);
  if (!user || !['ASSEMBLY_ADMIN'].includes(user.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  if (!studentId) return NextResponse.json({ message: 'studentId required' }, { status: 400 });

  try {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (student) {
      await prisma.student.update({ where: { id: studentId }, data: { status: 'SUSPENDED' as any } });
      await prisma.user.update({ where: { id: student.userId }, data: { status: 'SUSPENDED' } });
    }
    return NextResponse.json({ message: 'Deactivated' });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}