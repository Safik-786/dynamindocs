import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const doc = await prisma.document.findUnique({
    where: { id: "cmqts78t3009hfztw6ugysbwr" },
    include: { members: true }
  });
  console.log(doc);
}
main();
