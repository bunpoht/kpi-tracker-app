// Import เครื่องมือที่จำเป็น
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// สร้าง instance ของ PrismaClient เพื่อใช้คุยกับฐานข้อมูล
const prisma = new PrismaClient();

// สร้างฟังก์ชัน POST เพื่อรับข้อมูลเมื่อมีการส่ง request มาที่ URL นี้
export async function POST(request: Request) {
  try {
    // 1. รับข้อมูล JSON ที่ส่งมาจากผู้ใช้ (เช่น จากฟอร์มสมัครสมาชิก)
    const body = await request.json();
    const { name, email, password } = body;

    // 2. ตรวจสอบข้อมูลเบื้องต้น
    if (!name || !email || !password) {
      // ถ้าข้อมูลไม่ครบ ให้ส่งข้อความ error กลับไปพร้อม status code 400
      return NextResponse.json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    // 3. ตรวจสอบว่ามีอีเมลนี้ในระบบแล้วหรือยัง?
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      // ถ้ามีอีเมลนี้อยู่แล้ว ให้ส่ง error กลับไป
      return NextResponse.json({ message: 'อีเมลนี้มีผู้ใช้งานแล้ว' }, { status: 409 }); // 409 Conflict
    }

    // 4. เข้ารหัสรหัสผ่าน!
    const hashedPassword = await bcrypt.hash(password, 10); // 10 คือ "ความซับซ้อน" ในการเข้ารหัส

    // 5. สร้างผู้ใช้ใหม่ลงในฐานข้อมูล
    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword, // เก็บรหัสผ่านที่ถูกเข้ารหัสแล้ว
        // role จะเป็น USER โดยอัตโนมัติตามที่เราตั้งค่าไว้ใน schema.prisma
      },
    });
    
    // 6. ส่งข้อมูลผู้ใช้ใหม่กลับไป (แต่ลบรหัสผ่านออกก่อนเพื่อความปลอดภัย)
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 }); // 201 Created

  } catch (error) {
    // กรณีเกิด error ที่ไม่คาดคิด
    console.error("Register API Error: ", error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' }, { status: 500 });
  }
}