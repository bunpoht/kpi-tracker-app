import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

type Context = {
    params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: Context) {
    const { id: userId } = await context.params;

    try {
        // 1. ดึงข้อมูล User
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true },
        });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // 2. ดึง Goal ทั้งหมดที่ User คนนี้เคยมีส่วนร่วม (เคยส่งงาน)
        const userWorkLogs = await prisma.workLog.findMany({
            where: { authorId: userId },
            select: { goalId: true }
        });
        const involvedGoalIds = Array.from(new Set(userWorkLogs.map(log => log.goalId)));

        const goalsWithUserProgress = await prisma.goal.findMany({
            where: {
                id: { in: involvedGoalIds }
            },
            include: {
                workLogs: {
                    where: { authorId: userId }, // กรองเฉพาะงานของ User คนนี้
                },
            },
        });

        // 3. ประมวลผลข้อมูลเพื่อแสดงผล
        const userGoalProgress = goalsWithUserProgress.map(goal => {
            const userContribution = goal.workLogs.reduce((sum, log) => sum + log.quantity, 0);
            
            // เปอร์เซ็นต์นี้คือ "ผลงานของ User เทียบกับเป้าหมายรวมของ Goal"
            const percentageOfTotalTarget = goal.target > 0 ? (userContribution / goal.target) * 100 : 0;

            return {
                goalId: goal.id,
                goalTitle: goal.title,
                goalTarget: goal.target,
                unit: goal.unit,
                userContribution: userContribution,
                percentageOfTotalTarget: parseFloat(percentageOfTotalTarget.toFixed(2)),
            };
        });

        // 4. ดึง WorkLog ล่าสุด 5 รายการ
        const recentLogs = await prisma.workLog.findMany({
            where: { authorId: userId },
            take: 5,
            orderBy: { completedAt: 'desc' },
            include: {
                goal: { select: { title: true, unit: true } },
                author: { select: { name: true, id: true } }
            },
        });

        // 5. สรุปสถิติรวม
        const totalContributions = await prisma.workLog.aggregate({
            _sum: { quantity: true },
            where: { authorId: userId },
        });
        const totalLogsCount = await prisma.workLog.count({ where: { authorId: userId } });

        const responseData = {
            user,
            goalProgress: userGoalProgress,
            recentLogs,
            summary: {
                totalLogs: totalLogsCount,
                totalUnitsContributed: totalContributions._sum.quantity || 0,
                involvedGoalsCount: involvedGoalIds.length,
            }
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error(`Error fetching dashboard for user ${userId}:`, error);
        return NextResponse.json({ message: "Error fetching user dashboard data" }, { status: 500 });
    }
}