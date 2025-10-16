import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- GET Function ---
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    const goal = await prisma.goal.findUnique({ where: { id } });

    if (!goal) {
      return NextResponse.json({ message: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error(`Error fetching goal ${id}:`, error);
    return NextResponse.json(
      { message: 'Error fetching goal' },
      { status: 500 }
    );
  }
}

// --- PUT Function ---
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id: goalId } = context.params;

  try {
    const body = await request.json();
    const { title, unit, startDate, endDate, assignees } = body;

    if (!title || !unit || !startDate || !endDate || !assignees) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const totalTarget = assignees.reduce(
      (sum: number, assignee: { target: string }) =>
        sum + (parseInt(assignee.target, 10) || 0),
      0
    );

    // Transaction ensures all updates happen together
    await prisma.$transaction(async (tx) => {
      // 1. Update the goal
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

      // 2. Delete old assignments
      await tx.goalAssignment.deleteMany({ where: { goalId } });

      // 3. Add new assignments
      if (assignees.length > 0) {
        await tx.goalAssignment.createMany({
          data: assignees.map(
            (a: { userId: string; target: string }) => ({
              goalId,
              userId: a.userId,
              target: parseInt(a.target, 10) || 0,
            })
          ),
        });
      }
    });

    // Fetch updated goal with relations
    const updatedGoal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
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
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    // Safe delete with transaction
    await prisma.$transaction(async (tx) => {
      await tx.goalAssignment.deleteMany({ where: { goalId: id } });
      await tx.workLog.deleteMany({ where: { goalId: id } }); // cascade deletes related images
      await tx.goal.delete({ where: { id } });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting goal ${id}:`, error);
    return NextResponse.json(
      { message: 'Error deleting goal' },
      { status: 500 }
    );
  }
}
