import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

// เพิ่ม type สำหรับ context
type Context = {
  params: Promise<{ id: string }>;
};

// เพิ่ม context parameter แม้ว่าจะไม่ได้ใช้ก็ตาม
export async function GET(request: NextRequest, context: Context) {
  try {
    // await context.params; // ถ้าต้องการใช้ id ให้ uncomment บรรทัดนี้
    
    const searchParams = request.nextUrl.searchParams;
    const goalId = searchParams.get('goalId');

    // --- Special Case: Handle request for a single goal's detail ---
    if (goalId) {
      const goal = await prisma.goal.findUnique({
        where: { id: goalId },
      });

      if (!goal) {
        return NextResponse.json({ message: "Goal not found" }, { status: 404 });
      }

      // --- LOGIC ใหม่: กำหนดช่วงเวลาของปีงบประมาณของ Goal นี้ ---
      const goalStartDate = dayjs(goal.startDate);
      // ปีงบประมาณเริ่มต้นที่เดือน 10 (ตุลาคม)
      const fiscalYearStart = goalStartDate.month() >= 9 
          ? goalStartDate.year() 
          : goalStartDate.year() - 1;
      
      const fiscalStartDate = new Date(fiscalYearStart, 9, 1); // 1 ต.ค.
      const fiscalEndDate = new Date(fiscalYearStart + 1, 8, 30, 23, 59, 59); // 30 ก.ย. ปีถัดไป
      
      const workLogs = await prisma.workLog.findMany({
        where: { 
          goalId: goalId,
          completedAt: {
            gte: fiscalStartDate,
            lte: fiscalEndDate
          }
        },
        orderBy: { completedAt: 'desc' },
        include: { 
          author: { select: { name: true } },
          images: { select: { url: true } } // ดึง URL รูปภาพมาด้วย
        }
      });
      
      // --- LOGIC ใหม่: สร้างข้อมูลสำหรับ 12 เดือนของปีงบประมาณ ---
      const monthlyDataTemplate: { [key: string]: number } = {};
      for (let i = 0; i < 12; i++) {
        const month = dayjs(fiscalStartDate).add(i, 'month').format('YYYY-MM');
        monthlyDataTemplate[month] = 0;
      }
      
      const monthlyProgress = workLogs.reduce((acc, log) => {
        const monthYear = dayjs(log.completedAt).format('YYYY-MM');
        if(acc.hasOwnProperty(monthYear)){
            acc[monthYear] += log.quantity;
        }
        return acc;
      }, monthlyDataTemplate);

      const monthlyChartData = Object.keys(monthlyProgress).sort().map(monthYear => ({
        name: dayjs(monthYear).format('MMM'), // 'Oct', 'Nov', ...
        quantity: monthlyProgress[monthYear]
      }));
      
      const currentProgress = workLogs.reduce((sum, log) => sum + log.quantity, 0);
      const percentage = goal.target > 0 ? (currentProgress / goal.target) * 100 : 0;
      
      const responseData = {
        ...goal,
        workLogs: workLogs, // ส่ง workLogs ทั้งหมดไปด้วย
        currentProgress,
        percentage,
        monthlyChartData
      };

      return NextResponse.json([responseData]);
    }

    // --- Default Case: Handle request for the overall dashboard ---
    const fiscalYearStr = searchParams.get('year');
    const monthStr = searchParams.get('month');
    let startDate: Date;
    let endDate: Date;
    if (fiscalYearStr) {
      const year = parseInt(fiscalYearStr);
      if (monthStr) {
        const month = parseInt(monthStr);
        const calendarYear = (month >= 10) ? year - 1 : year;
        startDate = new Date(calendarYear, month - 1, 1);
        endDate = new Date(calendarYear, month, 0, 23, 59, 59);
      } else {
        startDate = new Date(year - 1, 9, 1);
        endDate = new Date(year, 8, 30, 23, 59, 59);
      }
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }
    const workLogWhereClause = { completedAt: { gte: startDate, lte: endDate } };
    const goals = await prisma.goal.findMany({
      include: {
        workLogs: {
          where: workLogWhereClause,
          select: { quantity: true, images: { select: { url: true } } },
        },
      },
    });
    const dashboardData = goals.map(goal => {
      const currentProgress = goal.workLogs.reduce((sum, log) => sum + log.quantity, 0);
      const percentage = goal.target > 0 ? (currentProgress / goal.target) * 100 : 0;
      return {
        id: goal.id,
        title: goal.title,
        target: goal.target,
        unit: goal.unit,
        currentProgress,
        percentage: parseFloat(percentage.toFixed(2)),
        workLogs: goal.workLogs,
      };
    });
    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ message: "Error fetching dashboard data" }, { status: 500 });
  }
}