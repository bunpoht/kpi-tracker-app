import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET and DELETE functions are okay.

// --- PUT: อัปเดต Goal (เวอร์ชันยกเครื่องใหม่ทั้งหมด) ---
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const { id: goalId } = params;
    try {
        const body = await request.json();
        const { title, unit, startDate, endDate, assignees } = body;

        // --- คำนวณ Total Target ใหม่ ---
        const totalTarget = assignees.reduce((sum: number, assignee: { target: string }) => sum + (parseInt(assignee.target, 10) || 0), 0);
        
        // --- ใช้ Transaction เพื่อความปลอดภัยของข้อมูล ---
        const result = await prisma.$transaction(async (tx) => {
            // 1. อัปเดตข้อมูลหลักของ Goal
            await tx.goal.update({
                where: { id: goalId },
                data: { title, unit, startDate: new Date(startDate), endDate: new Date(endDate), target: totalTarget }
            });

            // 2. ลบ Assignments เก่าทั้งหมดของ Goal นี้ทิ้งไปเลย (วิธีที่ง่ายและปลอดภัยที่สุด)
            await tx.goalAssignment.deleteMany({
                where: { goalId: goalId }
            });

            // 3. สร้าง Assignments ใหม่ทั้งหมดจากข้อมูลที่ส่งมา
            if (assignees && assignees.length > 0) {
                await tx.goalAssignment.createMany({
                    data: assignees.map((a: { userId: string, target: string }) => ({
                        goalId: goalId,
                        userId: a.userId,
                        target: parseInt(a.target, 10) || 0
                    }))
                });
            }
        });

        // 4. ดึงข้อมูล Goal ที่อัปเดตแล้วทั้งหมดกลับไปให้ Frontend
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