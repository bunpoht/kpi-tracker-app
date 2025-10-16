import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- GET Function (Corrected Type) ---
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    try {
        const goal = await prisma.goal.findUnique({ where: { id } });
        if (!goal) {
            return NextResponse.json({ message: 'Goal not found' }, { status: 404 });
        }
        return NextResponse.json(goal);
    } catch (error) {
        console.error(`Error fetching goal ${id}:`, error);
        return NextResponse.json({ message: "Error fetching goal" }, { status: 500 });
    }
}

// --- PUT Function (Corrected and Simplified) ---
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id: goalId } = params;
    try {
        const body = await request.json();
        const { title, unit, startDate, endDate, assignees } = body;

        if (!title || !unit || !startDate || !endDate || !assignees) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }
        
        const totalTarget = assignees.reduce((sum: number, assignee: { target: string }) => sum + (parseInt(assignee.target, 10) || 0), 0);
        
        // Using transaction to ensure data integrity
        await prisma.$transaction(async (tx) => {
            // 1. Update the main goal details
            await tx.goal.update({
                where: { id: goalId },
                data: { 
                    title, 
                    unit, 
                    startDate: new Date(startDate), 
                    endDate: new Date(endDate), 
                    target: totalTarget 
                }
            });

            // 2. Delete all existing assignments for this goal
            await tx.goalAssignment.deleteMany({
                where: { goalId: goalId }
            });

            // 3. Create new assignments from the provided list
            if (assignees.length > 0) {
                await tx.goalAssignment.createMany({
                    data: assignees.map((a: { userId: string, target: string }) => ({
                        goalId: goalId,
                        userId: a.userId,
                        target: parseInt(a.target, 10) || 0
                    }))
                });
            }
        });

        // After transaction, fetch the fully updated goal to return
        const updatedGoal = await prisma.goal.findUnique({
            where: { id: goalId },
            include: {
                assignments: {
                    include: {
                        user: { select: { id: true, name: true } }
                    }
                }
            }
        });
        
        return NextResponse.json(updatedGoal);

    } catch (error) {
        console.error(`Error updating goal ${goalId}:`, error);
        return NextResponse.json({ message: "An error occurred while updating the goal." }, { status: 500 });
    }
}

// --- DELETE Function (Corrected Type) ---
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    try {
        // Using transaction for safe deletion
        await prisma.$transaction(async (tx) => {
            await tx.goalAssignment.deleteMany({ where: { goalId: id } });
            await tx.workLog.deleteMany({ where: { goalId: id } }); // Note: This will also delete related images due to schema cascade
            await tx.goal.delete({ where: { id } });
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Error deleting goal ${id}:`, error);
        return NextResponse.json({ message: "Error deleting goal" }, { status: 500 });
    }
}