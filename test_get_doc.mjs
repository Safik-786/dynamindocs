import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const documentId = 'cmqts78t3009hfztw6ugysbwr';
  const userId = 'cmqtumriw000rfz8syowzygcv';
  
  const doc = await prisma.document.findFirst({
    where: {
      id: documentId,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } }
      ]
    },
    include: {
      operations: { orderBy: { createdAt: 'asc' } },
      members: { where: { userId } }
    }
  });
  console.log("Doc returned:", doc ? "Yes" : "No");
}
main();
