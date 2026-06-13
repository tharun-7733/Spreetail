const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        paidBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        participants: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    console.log(JSON.stringify(expenses, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
