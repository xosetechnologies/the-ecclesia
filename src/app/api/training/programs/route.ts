export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const programs = await prisma.trainingProgram.findMany({
      take: 50,
    });
    return NextResponse.json({ programs });
  } catch (error) {
    return NextResponse.json({ programs: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, targetAudience, mandatory } = body;

    const program = await prisma.trainingProgram.create({
      data: {
        title, description, targetAudience, mandatory: mandatory || false,
        status: 'PUBLISHED',
      },
    });

    return NextResponse.json({ program });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
