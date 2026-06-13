import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { groupId } = await params;

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.userId as string } }
    });
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: { participants: true, paidBy: { select: { id: true, name: true } } }
    });

    const settlements = await prisma.settlement.findMany({
      where: { groupId },
    });

    const balancesMap: Record<string, number> = {};

    for (const exp of expenses) {
      for (const p of exp.participants) {
        if (p.userId === exp.paidById) continue;
        
        // p.userId owes exp.paidById
        const key = `${p.userId}->${exp.paidById}`;
        balancesMap[key] = (balancesMap[key] || 0) + Number(p.shareAmount);
        
        const reverseKey = `${exp.paidById}->${p.userId}`;
        balancesMap[reverseKey] = (balancesMap[reverseKey] || 0) - Number(p.shareAmount);
      }
    }

    for (const s of settlements) {
      // payer paid receiver => payer owes less to receiver
      const key = `${s.payerId}->${s.receiverId}`;
      balancesMap[key] = (balancesMap[key] || 0) - Number(s.amount);

      const reverseKey = `${s.receiverId}->${s.payerId}`;
      balancesMap[reverseKey] = (balancesMap[reverseKey] || 0) + Number(s.amount);
    }

    const allUsers = await prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } }
    });
    const usersById = Object.fromEntries(allUsers.map(u => [u.userId, u.user]));

    const balances = [];
    const seen = new Set<string>();

    for (const [key, amount] of Object.entries(balancesMap)) {
      if (amount <= 0.01) continue; // ignore negative or zero amounts (only track positive owe)
      const [from, to] = key.split("->");
      if (!usersById[from] || !usersById[to]) continue;
      
      const pairKey = [from, to].sort().join('-');
      if (seen.has(pairKey)) continue;

      balances.push({
        fromUserId: from,
        toUserId: to,
        amount,
        fromUser: usersById[from],
        toUser: usersById[to]
      });
      seen.add(pairKey);
    }

    return NextResponse.json({ balances });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
