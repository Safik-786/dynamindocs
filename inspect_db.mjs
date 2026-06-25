import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const docId = "cmqts78t3009hfztw6ugysbwr"; // using the NEW document ID from screenshot!
    const doc = await prisma.document.findUnique({ where: { id: docId } });
    if (doc) {
      console.log("Content length:", doc.content ? doc.content.length : 'NULL');
      if (doc.content) {
        console.log("Content bytes (hex):", Buffer.from(doc.content).toString('hex'));
      }
    } else {
      console.log("Document not found");
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
