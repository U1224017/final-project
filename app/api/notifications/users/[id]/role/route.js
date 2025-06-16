import { prisma } from "../../../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  const { id } = params; 
  const { role } = await req.json();

  try {
    const updatedUser = await prisma.user.update({
      where: { id },      
      data: { role },
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error("❌ 更改角色失敗：", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}