import Dexie from "dexie";

// Create a new IndexedDB database named "OfflineDocsDB"
export const db = new Dexie("OfflineDocsDB");

db.version(1).stores({
  documents: "id, title, ownerId, updatedAt", // Local document cache
  syncQueue: "++id, documentId, clientId, clock" // Offline operations waiting to be synced
});

// Helper: Save operation to sync queue
export const queueSyncOperation = async (documentId, clientId, clock, updateBuffer) => {
  await db.syncQueue.add({
    documentId,
    clientId,
    clock,
    update: Buffer.from(updateBuffer).toString('base64')
  });
};

// Helper: Get pending operations for a document
export const getPendingOperations = async (documentId) => {
  return await db.syncQueue.where({ documentId }).toArray();
};

// Helper: Clear synced operations
export const clearSyncedOperations = async (ids) => {
  await db.syncQueue.bulkDelete(ids);
};
