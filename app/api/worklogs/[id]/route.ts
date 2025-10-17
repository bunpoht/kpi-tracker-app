import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

type Context = {
  params: Promise<{ id: string }>;
};

// GET and DELETE functions remain the same as before

// --- PUT: อัปเดต Work Log (เวอร์ชันอัปเกรด) ---
export async function PUT(request: NextRequest, context: Context) {
    const { id: workLogId } = await context.params;
    try {
        const body = await request.json();
        const { 
            description, quantity, completedAt, goalId, 
            imagesToAdd, // Array of new image URLs
            imagesToDelete // Array of image IDs to delete
        } = body;

        if (!description || !quantity || !completedAt || !goalId) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // --- ใช้ Transaction เพื่อจัดการหลาย Operation พร้อมกัน ---
        const transactionResult = await prisma.$transaction(async (tx) => {
            // 1. อัปเดตข้อมูลหลักของ WorkLog
            const updatedWorkLog = await tx.workLog.update({
                where: { id: workLogId },
                data: {
                    description,
                    quantity: parseInt(quantity, 10),
                    completedAt: new Date(completedAt),
                    goalId,
                },
            });

            // 2. ลบรูปภาพเก่า (ถ้ามี)
            if (imagesToDelete && imagesToDelete.length > 0) {
                await tx.image.deleteMany({
                    where: {
                        id: { in: imagesToDelete },
                        workLogId: workLogId, // Ensure we only delete images from this log
                    },
                });
            }

            // 3. เพิ่มรูปภาพใหม่ (ถ้ามี)
            if (imagesToAdd && imagesToAdd.length > 0) {
                await tx.image.createMany({
                    data: imagesToAdd.map((url: string) => ({
                        url: url,
                        workLogId: workLogId,
                    })),
                });
            }
            
            return updatedWorkLog;
        });

        // ดึงข้อมูลล่าสุดทั้งหมดกลับไปเพื่ออัปเดต UI
        const finalWorkLog = await prisma.workLog.findUnique({
            where: { id: workLogId },
            include: {
                author: { select: { name: true, id: true } },
                goal: true,
                images: true,
            }
        });

        return NextResponse.json(finalWorkLog);

    } catch (error: any) {
        console.error(`Error updating worklog ${workLogId}:`, error);
        if (error.code === 'P2025') {
            return NextResponse.json({ message: "Work log not found." }, { status: 404 });
        }
        return NextResponse.json({ message: "Error updating worklog" }, { status: 500 });
    }
}


// --- DELETE: ลบ Work Log ---
export async function DELETE(request: NextRequest, context: Context) {
    const { id } = await context.params;
    try {
        await prisma.image.deleteMany({
            where: { workLogId: id },
        });
        await prisma.workLog.delete({
            where: { id },
        });
        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        console.error(`Error deleting worklog ${id}:`, error);
        if (error.code === 'P2025') {
            return NextResponse.json({ message: "Work log not found." }, { status: 404 });
        }
        return NextResponse.json({ message: "Error deleting worklog" }, { status: 500 });
    }
}