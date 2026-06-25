import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const docId = "cmqtoted60002fzssg1nrg1ph";
    const doc = await prisma.document.findUnique({ where: { id: docId } });
    console.log("Doc Content:", doc?.content ? "Exists (length: " + doc.content.length + ")" : "NULL");
    
    const ops = await prisma.syncOperation.count({ where: { documentId: docId } });
    console.log("Sync Operations Count:", ops);
  } catch (e) {
    console.error("DB Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
