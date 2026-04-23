export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'the-ecclesia-secret-key-2024';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      denominationName,
      country,
      headquartersAddress,
      contactName,
      contactEmail,
      contactPhone,
      estimatedAssemblies,
    } = body;

    const existingUser = await prisma.user.findUnique({
      where: { email: contactEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      );
    }

    const org = await prisma.organizationUnit.create({
      data: {
        name: denominationName,
        type: 'NATIONAL',
        country,
        address: headquartersAddress,
        contactPhone,
        status: 'ACTIVE',
      },
    });

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.user.create({
      data: {
        email: contactEmail,
        password: hashedPassword,
        firstName: contactName.split(' ')[0],
        lastName: contactName.split(' ').slice(1).join(' ') || '',
        phone: contactPhone,
        role: 'NATIONAL_ADMIN',
        orgUnitId: org.id,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      message: 'Denomination registered successfully. Pending approval.',
      organizationId: org.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
