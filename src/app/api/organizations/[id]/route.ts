import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'the-ecclesia-secret-key-2024';

function getUserFromToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch { return null; }
}

export async function PATCH(request: Request) {
  const user = getUserFromToken(request);
  if (!user || user.role !== 'PLATFORM_SUPER_ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { organizationId, status, action, notes } = body;

    let updateData: any = {};
    
    if (action === 'approve') {
      updateData = { status: 'ACTIVE', subscriptionStatus: 'ACTIVE' };
    } else if (action === 'suspend') {
      updateData = { status: 'SUSPENDED' };
    } else if (action === 'reactivate') {
      updateData = { status: 'ACTIVE', subscriptionStatus: 'ACTIVE' };
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updated = await prisma.organizationUnit.update({
      where: { id: organizationId },
      data: updateData,
    });

    return NextResponse.json({ organization: updated });
  } catch (error) {
    console.error('Error updating chapter:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = getUserFromToken(request);
  if (!user || user.role !== 'PLATFORM_SUPER_ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type, organizationId, country, geographicArea, pastorLeader, contactPhone } = body;

    const org = await prisma.organizationUnit.create({
      data: {
        name,
        type,
        organizationId: organizationId || null,
        country,
        geographicArea,
        pastorLeader,
        contactPhone,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ organization: org });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}