import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/Users";
import { generateRSAKeyPair } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, fullName, role } = body;

    if (!username || !email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["student", "faculty", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    await connectDB();

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { publicKey, privateKey } = generateRSAKeyPair();

    const user = await User.create({
      username,
      email,
      fullName,
      password: hashedPassword,
      role,
      publicKey,
      privateKey,
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        userId: user._id,
        role: user.role,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}