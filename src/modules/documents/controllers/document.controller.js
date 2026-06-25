import { successResponse } from "@/shared/utils/apiResponse";
import * as docService from "../services/document.service";

export const create = async (ctx) => {
  const data = ctx.validatedData;
  const userId = ctx.user.id;
  
  const newDoc = await docService.createNewDocument(userId, data.title);
  return successResponse("Document created successfully", newDoc, 201);
};

export const list = async (ctx) => {
  const userId = ctx.user.id;
  
  const docs = await docService.getUserDocuments(userId);
  return successResponse("Documents retrieved successfully", docs, 200);
};

export const sync = async (ctx) => {
  const documentId = ctx.params.id;
  const userId = ctx.user.id;
  const data = ctx.validatedData;
  
  const result = await docService.syncDocument(documentId, userId, data.operations);
  return successResponse("Document synced successfully", result, 200);
};

export const getById = async (ctx) => {
  const documentId = ctx.params.id;
  const userId = ctx.user.id;
  
  const doc = await docService.getDocument(documentId, userId);
  return successResponse("Document retrieved successfully", doc, 200);
};

export const rename = async (ctx) => {
  const documentId = ctx.params.id;
  const userId = ctx.user.id;
  const { title } = ctx.validatedData;
  
  const doc = await docService.renameDocument(documentId, userId, title);
  return successResponse("Document renamed successfully", doc, 200);
};

export const getState = async (ctx) => {
  const documentId = ctx.params.id;
  const userId = ctx.user.id;
  
  const state = await docService.getDocumentState(documentId, userId);
  return successResponse("Document state retrieved successfully", state, 200);
};

export const createVersion = async (ctx) => {
  const documentId = ctx.params.id;
  const userId = ctx.user.id;
  const body = await ctx.req.json();
  
  const version = await docService.createVersion(documentId, userId, body.name);
  return successResponse("Version created successfully", version, 201);
};

export const getVersions = async (ctx) => {
  const documentId = ctx.params.id;
  const userId = ctx.user.id;
  
  const versions = await docService.getVersions(documentId, userId);
  return successResponse("Versions retrieved successfully", versions, 200);
};

export const getVersionState = async (ctx) => {
  const documentId = ctx.params.id;
  const versionId = ctx.params.versionId;
  const userId = ctx.user.id;
  
  const state = await docService.getVersionState(documentId, versionId, userId);
  return successResponse("Version state retrieved successfully", state, 200);
};

export const getMembers = async (ctx) => {
  const documentId = ctx.params.id;
  const userId = ctx.user.id;
  const members = await docService.getMembers(documentId, userId);
  return successResponse("Members retrieved successfully", members, 200);
};

export const addMember = async (ctx) => {
  const documentId = ctx.params.id;
  const userId = ctx.user.id;
  const body = await ctx.req.json();
  const member = await docService.addMember(documentId, userId, body.email, body.role);
  return successResponse("Member added successfully", member, 201);
};

export const updateMemberRole = async (ctx) => {
  const documentId = ctx.params.id;
  const memberId = ctx.params.memberId;
  const userId = ctx.user.id;
  const body = await ctx.req.json();
  const member = await docService.updateMemberRole(documentId, userId, memberId, body.role);
  return successResponse("Member role updated successfully", member, 200);
};

export const removeMember = async (ctx) => {
  const documentId = ctx.params.id;
  const memberId = ctx.params.memberId;
  const userId = ctx.user.id;
  await docService.removeMember(documentId, userId, memberId);
  return successResponse("Member removed successfully", null, 200);
};
