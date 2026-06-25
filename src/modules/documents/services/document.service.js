import * as Y from 'yjs';
import * as docRepo from '../repositories/document.repository';
import * as authRepo from '../../auth/repositories/auth.repository';

const getUserRole = (doc, userId) => {
  if (doc.ownerId === userId) return "OWNER";
  const member = doc.members?.find(m => m.userId === userId);
  return member ? member.role : null;
};

export const createNewDocument = async (userId, title) => {
  return await docRepo.createDocument(userId, title);
};

export const getUserDocuments = async (userId) => {
  const docs = await docRepo.getDocumentsByUser(userId);
  return docs.map(doc => {
    const { content, operations, ...metadata } = doc;
    metadata.role = getUserRole(doc, userId);
    return metadata;
  });
};

export const syncDocument = async (documentId, userId, operations) => {
  const doc = await docRepo.getDocumentById(documentId, userId);
  if (!doc) {
    const error = new Error("Document not found or access denied");
    error.statusCode = 404;
    throw error;
  }
  
  const role = getUserRole(doc, userId);
  if (role === "VIEWER") {
    const error = new Error("Viewers cannot sync changes");
    error.statusCode = 403;
    throw error;
  }

  const opsWithBuffers = operations.map(op => ({
    ...op,
    update: Buffer.from(op.update, 'base64')
  }));
  
  const yDoc = new Y.Doc();
  for (const op of doc.operations) {
    try {
      Y.applyUpdate(yDoc, new Uint8Array(op.update));
    } catch (e) {
      console.error("Failed to apply historical Yjs update", e);
    }
  }

  const validNewOps = [];
  for (const op of opsWithBuffers) {
    try {
      Y.applyUpdate(yDoc, new Uint8Array(op.update));
      validNewOps.push(op);
    } catch (e) {
      console.error("Rejected poisoned Yjs update from client", e);
    }
  }

  if (validNewOps.length > 0) {
    await docRepo.saveSyncOperations(documentId, validNewOps);
  }

  const currentState = Buffer.from(Y.encodeStateAsUpdate(yDoc));
  await docRepo.updateDocumentState(documentId, currentState);

  return { state: currentState.toString('base64') };
};

export const getDocument = async (documentId, userId) => {
  const doc = await docRepo.getDocumentById(documentId, userId);
  if (!doc) {
    const error = new Error("Document not found or access denied");
    error.statusCode = 404;
    throw error;
  }
  const { content, operations, ...metadata } = doc;
  metadata.role = getUserRole(doc, userId);
  return metadata;
};

export const renameDocument = async (documentId, userId, title) => {
  const doc = await docRepo.getDocumentById(documentId, userId);
  if (!doc || getUserRole(doc, userId) === "VIEWER") {
    const error = new Error("Document not found or access denied");
    error.statusCode = 403;
    throw error;
  }
  return await docRepo.updateDocumentTitle(documentId, title);
};

export const getDocumentState = async (documentId, userId) => {
  const doc = await docRepo.getDocumentById(documentId, userId);
  if (!doc) {
    const error = new Error("Document not found or access denied");
    error.statusCode = 404;
    throw error;
  }
  
  const role = getUserRole(doc, userId);
  const result = { role };
  
  if (doc.content) {
    const buffer = Buffer.isBuffer(doc.content) ? doc.content : Buffer.from(doc.content);
    result.state = buffer.toString('base64');
  } else {
    result.state = null;
  }
  
  return result;
};

export const createVersion = async (documentId, userId, name) => {
  const doc = await docRepo.getDocumentById(documentId, userId);
  if (!doc || getUserRole(doc, userId) === "VIEWER") {
    const error = new Error("Document not found or access denied");
    error.statusCode = 403;
    throw error;
  }
  if (!doc.content) {
    const error = new Error("Cannot create a version of an empty document");
    error.statusCode = 400;
    throw error;
  }
  return await docRepo.createDocumentVersion(documentId, userId, name || `Version ${new Date().toLocaleString()}`, doc.content);
};

export const getVersions = async (documentId, userId) => {
  const doc = await docRepo.getDocumentById(documentId, userId);
  if (!doc) {
    const error = new Error("Document not found or access denied");
    error.statusCode = 404;
    throw error;
  }
  return await docRepo.getDocumentVersions(documentId);
};

export const getVersionState = async (documentId, versionId, userId) => {
  const doc = await docRepo.getDocumentById(documentId, userId);
  if (!doc) {
    const error = new Error("Document not found or access denied");
    error.statusCode = 404;
    throw error;
  }
  const version = await docRepo.getDocumentVersionById(versionId);
  if (!version || version.documentId !== documentId) {
    const error = new Error("Version not found");
    error.statusCode = 404;
    throw error;
  }
  const buffer = Buffer.isBuffer(version.content) ? version.content : Buffer.from(version.content);
  return { state: buffer.toString('base64') };
};

// Member Management Services
export const getMembers = async (documentId, userId) => {
  const doc = await docRepo.getDocumentById(documentId, userId);
  if (!doc) {
    const error = new Error("Document not found or access denied");
    error.statusCode = 404;
    throw error;
  }
  return await docRepo.getDocumentMembers(documentId);
};

export const addMember = async (documentId, ownerId, email, role) => {
  const doc = await docRepo.getDocumentById(documentId, ownerId);
  if (!doc || doc.ownerId !== ownerId) {
    const error = new Error("Only the owner can add members");
    error.statusCode = 403;
    throw error;
  }
  
  const userToAdd = await authRepo.findUserByEmail(email);
  if (!userToAdd) {
    const error = new Error("User with this email not found");
    error.statusCode = 404;
    throw error;
  }
  
  if (userToAdd.id === ownerId) {
    const error = new Error("Owner cannot be added as a member");
    error.statusCode = 400;
    throw error;
  }
  
  return await docRepo.addDocumentMember(documentId, userToAdd.id, role);
};

export const updateMemberRole = async (documentId, ownerId, memberId, role) => {
  const doc = await docRepo.getDocumentById(documentId, ownerId);
  if (!doc || doc.ownerId !== ownerId) {
    const error = new Error("Only the owner can update member roles");
    error.statusCode = 403;
    throw error;
  }
  return await docRepo.updateDocumentMemberRole(memberId, role);
};

export const removeMember = async (documentId, ownerId, memberId) => {
  const doc = await docRepo.getDocumentById(documentId, ownerId);
  if (!doc || doc.ownerId !== ownerId) {
    const error = new Error("Only the owner can remove members");
    error.statusCode = 403;
    throw error;
  }
  return await docRepo.removeDocumentMember(memberId);
};
