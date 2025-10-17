import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

// --- GET: ดึงข้อมูล WorkLog ทั้งหมด (พร้อมข้อมูลที่เกี่ยวข้อง) ---
export async function GET(request: Request) {
    try {
        const workLogs = await prisma.workLog.findMany({
            include: {
                // เลือกข้อมูลเฉพาะที่จำเป็นจาก author เพื่อความปลอดภัย
                author: {
                    select: { id: true, name: true, email: true } 
                },
                // ดึงข้อมูล goal ทั้งหมดที่เกี่ยวข้องมาด้วย
                goal: true,
                // ดึงข้อมูลรูปภาพทั้งหมดมาด้วย
                images: true, 
            },
            orderBy: {
                completedAt: 'desc' // เรียงตามวันที่ทำงานเสร็จล่าสุดก่อน
            }
        });
        return NextResponse.json(workLogs);
    } catch (error) {
        console.error("Error fetching worklogs:", error);
        return NextResponse.json({ message: "Error fetching worklogs" }, { status: 500 });
    }
}

// --- POST: สร้าง WorkLog ใหม่ (พร้อมบันทึก URL รูปภาพ) ---
export async function POST(request: Request) {
    try {
        // รับข้อมูลจาก body ของ request
        const body = await request.json();
        const { 
            description, 
            quantity, 
            completedAt, 
            goalId, 
            authorId, 
            images // รับ 'images' ที่เป็น array of URLs
        } = body;

        // ตรวจสอบว่ามีข้อมูลที่จำเป็นครบถ้วนหรือไม่
        if (!description || !quantity || !completedAt || !goalId || !authorId) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // สร้าง WorkLog ใหม่ในฐานข้อมูล
        const newWorkLog = await prisma.workLog.create({
            data: {
                description,
                quantity: parseInt(quantity, 10), // แปลง quantity เป็นตัวเลข
                completedAt: new Date(completedAt), // แปลงวันที่เป็น Date object
                goal: { 
                    connect: { id: goalId } // เชื่อมความสัมพันธ์กับ Goal ที่มีอยู่
                }, 
                author: { 
                    connect: { id: authorId } // เชื่อมความสัมพันธ์กับ User (ผู้สร้าง)
                },
                // --- ส่วนสำคัญ: สร้าง records รูปภาพ ---
                images: {
                    // ถ้ามี array ของ 'images' ส่งมา (และไม่ใช array ว่าง)
                    // ให้สร้าง record ใหม่ในตาราง Image สำหรับแต่ละ URL
                    create: Array.isArray(images) ? images.map((url: string) => ({ url })) : [],
                }
            },
            // include ข้อมูลที่เกี่ยวข้องกลับไปด้วย เพื่อให้ client update UI ได้ทันที
            include: {
                author: {
                    select: { id: true, name: true, email: true }
                },
                goal: true,
                images: true
            }
        });

        return NextResponse.json(newWorkLog, { status: 201 }); // 201 Created
    } catch (error) {
        console.error("Error creating worklog:", error);
        // ตรวจสอบ error ที่อาจเกิดจาก Prisma (เช่นหา foreign key ไม่เจอ)
        if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
            return NextResponse.json({ message: "Invalid goalId or authorId provided." }, { status: 400 });
        }
        return NextResponse.json({ message: "Error creating worklog" }, { status: 500 });
    }
}