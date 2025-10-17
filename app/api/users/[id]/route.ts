import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";
// หมายเหตุ: ในระบบ production จริง ควรมี Middleware ที่แข็งแกร่งกว่านี้
// เพื่อตรวจสอบ Token และ Role ของผู้ใช้ที่ส่ง request มาทุกครั้ง
// แต่ในขั้นตอนนี้ เราจะเขียน Logic การตรวจสอบไว้ใน API โดยตรงก่อน

const prisma = new PrismaClient();

type Context = {
  params: Promise<{ id: string }>;
};

// --- GET: ดึงข้อมูลผู้ใช้ตาม ID ---
export async function GET(request: NextRequest, context: Context) {
  const { id } = await context.params;
  // TODO: Add Admin role check
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    return NextResponse.json({ message: "Error fetching user" }, { status: 500 });
  }
}

// --- PUT: อัปเดตข้อมูลผู้ใช้ (เช่น เปลี่ยนชื่อ, เปลี่ยน Role) ---
export async function PUT(request: NextRequest, context: Context) {
  const { id } = await context.params;
  // TODO: Add Admin role check
  try {
    const body = await request.json();
    const { name, email, role } = body;

    // ไม่ควรอนุญาตให้แก้ไขรหัสผ่านผ่าน endpoint นี้
    // ควรมี endpoint แยกสำหรับการ reset password
    const dataToUpdate: { name?: string; email?: string; role?: 'ADMIN' | 'USER' } = {};

    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email;
    if (role) dataToUpdate.role = role;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });
    
    const { password, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error(`Error updating user ${id}:`, error);
    // จัดการกรณีที่อีเมลซ้ำ
    if (error.code === 'P2002') {
        return NextResponse.json({ message: "Email already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Error updating user" }, { status: 500 });
  }
}

// --- DELETE: ลบผู้ใช้ ---
export async function DELETE(request: NextRequest, context: Context) {
  const { id } = await context.params;
  // TODO: Add Admin role check
  try {
    // ก่อนลบ User, อาจจะต้องพิจารณาว่าจะทำอย่างไรกับ WorkLog ที่ User นี้สร้างไว้
    // เช่น จะลบไปด้วย หรือจะเปลี่ยน authorId เป็น User กลาง (เช่น 'Deleted User')
    // ในที่นี้จะทำการลบ User ไปเลย ซึ่งอาจจะทำให้เกิด error ถ้ามี WorkLog ผูกอยู่
    // วิธีแก้ที่ปลอดภัยกว่าคือการ "Deactivate" user แทนการลบจริง
    
    // ตรวจสอบว่ามี WorkLog ที่ผูกอยู่หรือไม่
    const relatedWorkLogs = await prisma.workLog.count({
        where: { authorId: id }
    });

    if (relatedWorkLogs > 0) {
        return NextResponse.json({ message: "Cannot delete user with existing work logs. Please reassign their work first." }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 }); // 204 No Content, หมายถึงสำเร็จแต่ไม่มีข้อมูลส่งกลับ
  } catch (error: any) {
    console.error(`Error deleting user ${id}:`, error);
     // จัดการกรณีที่หา user ที่จะลบไม่เจอ
    if (error.code === 'P2025') {
        return NextResponse.json({ message: "User not found." }, { status: 404 });
    }
    return NextResponse.json({ message: "Error deleting user" }, { status: 500 });
  }
}