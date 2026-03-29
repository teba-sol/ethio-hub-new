import { NextResponse } from "next/server";
import * as authService from "../../../../services/auth.service";
import { connectDB } from "../../../../lib/mongodb";

export async function POST(request: Request) {
  await connectDB();

  try {
    const body = await request.json();
    const user = await authService.register(body);
    return NextResponse.json({ message: "User created successfully", user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}