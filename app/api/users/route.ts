// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const dynamic = "force-dynamic";
// TODO: เพิ่ม Middleware ตรวจสอบว่าเป็น Admin หรือไม่

const prisma = new PrismaClient();

// GET all users
export async function GET() {
    // ควรป้องกันให้เฉพาะ Admin เท่านั้นที่เรียกได้
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true } // ไม่ส่ง password กลับไป
    });
    return NextResponse.json(users);
}

// POST a new user (by Admin)
export async function POST(request: Request) {
    // ควรป้องกันให้เฉพาะ Admin เท่านั้นที่เรียกได้
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
        return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role, // Admin สามารถกำหนด Role ได้เลย
        },
    });
    
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });
}