import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 1. ตรวจสอบว่ากรอกข้อมูลครบหรือไม่
    if (!email || !password) {
      return NextResponse.json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' }, { status: 400 });
    }

    // 2. ค้นหาผู้ใช้จากอีเมลในฐานข้อมูล
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      // ถ้าไม่พบผู้ใช้ ให้ส่ง error (เพื่อความปลอดภัย เราจะไม่บอกว่า "ไม่พบผู้ใช้" หรือ "รหัสผิด" แต่จะบอกรวมๆ)
      return NextResponse.json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 }); // 401 Unauthorized
    }

    // 3. เปรียบเทียบรหัสผ่านที่ผู้ใช้กรอก กับรหัสผ่านที่เข้ารหัสไว้ในฐานข้อมูล
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // ถ้ารหัสผ่านไม่ตรงกัน ให้ส่ง error
      return NextResponse.json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    // 4. ถ้ารหัสผ่านถูกต้อง! สร้าง JWT Token (คีย์การ์ด)
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // ดึงรหัสลับมาจาก .env
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT Secret not found in .env file');
    }

    const token = jwt.sign(tokenPayload, secret, {
      expiresIn: '7d', // Token จะหมดอายุใน 7 วัน
    });

    // 5. ส่ง Token กลับไปให้ผู้ใช้
    return NextResponse.json({ message: 'เข้าสู่ระบบสำเร็จ', token: token }, { status: 200 });

  } catch (error) {
    console.error("Login API Error: ", error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' }, { status: 500 });
  }
}