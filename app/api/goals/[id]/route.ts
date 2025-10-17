import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

// เปลี่ยน type ของ context ให้เหมือนกันทุก function
type Context = {
  params: Promise<{ id: string }>;
};

// --- GET Function ---
export async function GET(request: NextRequest, context: Context) {
  const { id } = await context.params;

  try {
    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal) {
      return NextResponse.json({ message: 'Goal not found' }, { status: 404 });
    }
    return NextResponse.json(goal);
  } catch (error) {
    console.error(`Error fetching goal ${id}:`, error);
    return NextResponse.json({ message: 'Error fetching goal' }, { status: 500 });
  }
}

// --- PUT Function ---
export async function PUT(request: NextRequest, context: Context) {
  const { id: goalId } = await context.params;

  try {
    const body = await request.json();
    const { title, unit, startDate, endDate, assignees } = body;

    if (!title || !unit || !startDate || !endDate || !assignees) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const totalTarget = assignees.reduce(
      (sum: number, assignee: { target: string }) => sum + (parseInt(assignee.target, 10) || 0),
      0
    );

    await prisma.$transaction(async (tx) => {
      await tx.goal.update({
        where: { id: goalId },
        data: {
          title,
          unit,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          target: totalTarget,
        },
      });

      await tx.goalAssignment.deleteMany({ where: { goalId } });

      if (assignees.length > 0) {
        await tx.goalAssignment.createMany({
          data: assignees.map((a: { userId: string; target: string }) => ({
            goalId,
            userId: a.userId,
            target: parseInt(a.target, 10) || 0,
          })),
        });
      }
    });

    const updatedGoal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        assignments: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error(`Error updating goal ${goalId}:`, error);
    return NextResponse.json(
      { message: 'An error occurred while updating the goal.' },
      { status: 500 }
    );
  }
}

// --- DELETE Function ---
export async function DELETE(request: NextRequest, context: Context) {
  const { id } = await context.params;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.goalAssignment.deleteMany({ where: { goalId: id } });
      await tx.workLog.deleteMany({ where: { goalId: id } });
      await tx.goal.delete({ where: { id } });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting goal ${id}:`, error);
    return NextResponse.json({ message: 'Error deleting goal' }, { status: 500 });
  }
}