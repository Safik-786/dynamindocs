import { NextResponse } from "next/server";

export function successResponse(message, data = null, statusCode = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status: statusCode }
  );
}

export function errorResponse(message, statusCode = 500, errors = null, headers = {}) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
    },
    { status: statusCode, headers }
  );
}
