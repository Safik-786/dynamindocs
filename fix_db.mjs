import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const docId = "cmqtoted60002fzssg1nrg1ph";
    
    // Clear all corrupt operations and content
    await prisma.syncOperation.deleteMany({
      where: { documentId: docId }
    });

    await prisma.document.update({
      where: { id: docId },
      data: { content: null }
    });

    console.log("Document successfully reset to a clean state!");
  } catch (e) {
    console.error("DB Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
