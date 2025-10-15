import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// --- GET: ดึงข้อมูลเป้าหมายทั้งหมด ---
// (ฟังก์ชันนี้ยังคงทำงานเหมือนเดิม)
export async function GET() {
  try {
    const goals = await prisma.goal.findMany({
      orderBy: {
        endDate: 'desc',
      },
      // เราจะ include ข้อมูลผู้รับผิดชอบไปด้วยเพื่อให้หน้าตารางแสดงผลได้
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });
    return NextResponse.json(goals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json({ message: "Error fetching goals" }, { status: 500 });
  }
}

// --- POST: สร้างเป้าหมายใหม่ (พร้อมกับ Assignees) ---
export async function POST(request: Request) {
  // TODO: เพิ่ม Middleware ตรวจสอบว่าเป็น Admin หรือไม่
  try {
    const body = await request.json();
    const { 
        title, 
        unit, 
        startDate, 
        endDate, 
        assignees // คาดว่าเป็น Array of { userId: string, target: string }
    } = body;

    if (!title || !unit || !startDate || !endDate || !assignees || !Array.isArray(assignees) || assignees.length === 0) {
      return NextResponse.json({ message: 'Missing or invalid required fields' }, { status: 400 });
    }
    
    // คำนวณเป้าหมายรวมจากเป้าหมายย่อยของทุกคน
    const totalTarget = assignees.reduce((sum: number, assignee: { target: string }) => {
        const targetValue = parseInt(assignee.target, 10);
        return sum + (isNaN(targetValue) ? 0 : targetValue);
    }, 0);

    // สร้าง Goal พร้อมกับ GoalAssignment ที่เชื่อมโยงกันใน transaction เดียว
    const newGoal = await prisma.goal.create({
      data: {
        title,
        target: totalTarget, // บันทึกเป้าหมายรวม
        unit,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        // ใช้ Nested Create เพื่อสร้าง GoalAssignment ไปพร้อมกัน
        assignments: {
          create: assignees.map((assignee: { userId: string, target: string }) => ({
            userId: assignee.userId,
            target: parseInt(assignee.target, 10),
          })),
        },
      },
      // ส่งข้อมูลที่สร้างทั้งหมดกลับไป (รวมถึง assignments)
      include: {
        assignments: {
            include: {
                user: {
                    select: { name: true }
                }
            }
        },
      }
    });

    return NextResponse.json(newGoal, { status: 201 });

  } catch (error) {
    console.error("Error creating goal:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // จัดการ error ที่อาจเกิดขึ้น เช่น userId ไม่ถูกต้อง
        if (error.code === 'P2003') {
            return NextResponse.json({ message: "Invalid user ID provided for assignment." }, { status: 400 });
        }
        // จัดการ error กรณีพยายาม assign user คนเดิมซ้ำใน goal เดียว
        if (error.code === 'P2002') {
             return NextResponse.json({ message: "A user can only be assigned to a goal once." }, { status: 409 });
        }
    }
    return NextResponse.json({ message: "Error creating goal" }, { status: 500 });
  }
}