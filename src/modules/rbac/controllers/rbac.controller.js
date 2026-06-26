import { NextResponse } from "next/server";
import * as rbacService from "../services/rbac.service";

export const list = async (ctx) => {
  const data = await rbacService.getRbacData();
  return NextResponse.json(data);
};

export const updatePermission = async (ctx) => {
  const data = ctx.validatedData || await ctx.req.json();
  const result = await rbacService.updateRolePermission(data);
  return NextResponse.json(result);
};
