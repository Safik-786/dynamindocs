import { NextResponse } from "next/server";
import * as userService from "../services/user.service";

export const list = async (ctx) => {
  const page = parseInt(ctx.query.page || "1", 10);
  const limit = parseInt(ctx.query.limit || "10", 10);
  const search = ctx.query.q || "";

  const data = await userService.getUsers({ page, limit, search });
  return NextResponse.json(data);
};
