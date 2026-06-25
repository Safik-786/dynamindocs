import { prisma } from "@/lib/prisma";

export const createDocument = async (ownerId, title) => {
  return await prisma.document.create({
    data: {
      title,
      ownerId,
      members: {
        create: {
          userId: ownerId,
          role: "OWNER"
        }
      }
    }
  });
};

export const getDocumentsByUser = async (userId) => {
  return await prisma.document.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } }
      ]
    },
    include: {
      owner: { select: { name: true, email: true } },
      _count: { select: { members: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });
};

export const getDocumentById = async (documentId, userId) => {
  // Check if user has access
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
  return doc;
};

export const saveSyncOperations = async (documentId, operations) => {
  // operations is an array of { clientId, clock, update (Buffer) }
  return await prisma.syncOperation.createMany({
    data: operations.map(op => ({
      documentId,
      clientId: op.clientId,
      clock: op.clock,
      update: op.update,
    })),
    skipDuplicates: true // in case of retry
  });
};

export const updateDocumentState = async (documentId, contentBuffer) => {
  return await prisma.document.update({
    where: { id: documentId },
    data: { content: contentBuffer, updatedAt: new Date() }
  });
};

export const updateDocumentTitle = async (documentId, title) => {
  return await prisma.document.update({
    where: { id: documentId },
    data: { title, updatedAt: new Date() }
  });
};

export const createDocumentVersion = async (documentId, userId, name, contentBuffer) => {
  return await prisma.documentVersion.create({
    data: {
      documentId,
      createdBy: userId,
      name,
      content: contentBuffer
    }
  });
};

export const getDocumentVersions = async (documentId) => {
  const versions = await prisma.documentVersion.findMany({
    where: { documentId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      createdBy: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  const userIds = [...new Set(versions.map(v => v.createdBy).filter(Boolean))];
  
  if (userIds.length === 0) return versions;

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });

  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});

  return versions.map(v => ({
    ...v,
    author: v.createdBy ? userMap[v.createdBy] : null
  }));
};

export const getDocumentVersionById = async (versionId) => {
  return await prisma.documentVersion.findUnique({
    where: { id: versionId }
  });
};

export const addDocumentMember = async (documentId, userId, role) => {
  return await prisma.documentMember.create({
    data: { documentId, userId, role }
  });
};

export const getDocumentMembers = async (documentId) => {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { 
      owner: { select: { id: true, name: true, email: true } },
      members: {
        select: {
          id: true,
          role: true,
          user: { select: { id: true, name: true, email: true } }
        }
      }
    }
  });
  return doc;
};

export const updateDocumentMemberRole = async (memberId, role) => {
  return await prisma.documentMember.update({
    where: { id: memberId },
    data: { role }
  });
};

export const removeDocumentMember = async (memberId) => {
  return await prisma.documentMember.delete({
    where: { id: memberId }
  });
};
