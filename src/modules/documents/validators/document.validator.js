import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long").default("Untitled Document"),
});

export const renameDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
});

export const syncOperationsSchema = z.object({
  operations: z.array(z.object({
    clientId: z.number(),
    clock: z.number(),
    update: z.string() // Base64 encoded Yjs update
  })).max(1000, "Too many operations in one sync request (Payload Limit)"),
});
