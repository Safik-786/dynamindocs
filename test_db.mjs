import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const docId = "cmqtoted60002fzssg1nrg1ph";
    
    const doc = await prisma.document.findUnique({ where: { id: docId } });
    console.log("Doc:", doc ? "Found" : "Not Found");

    if (doc) {
      await prisma.syncOperation.create({
        data: {
          documentId: docId,
          clientId: 12345,
          clock: Date.now(),
          update: Buffer.from("test")
        }
      });
      console.log("Insert success!");
    }
  } catch (e) {
    console.error("DB Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
