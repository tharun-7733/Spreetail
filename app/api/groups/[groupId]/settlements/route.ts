import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { groupId } = await params;
    
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.userId as string } }
    });
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { payerId, receiverId, amount } = body;

    if (!payerId || !receiverId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const settlement = await prisma.settlement.create({
      data: {
        groupId,
        payerId,
        receiverId,
        amount,
      }
    });

    return NextResponse.json({ settlement: JSON.parse(JSON.stringify(settlement)) }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create settlement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
