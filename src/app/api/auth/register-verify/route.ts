import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { Otp } from "@/models/Otp";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, otp, password, name } = await req.json();

    if (!email || !otp || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate OTP
    const validOtp = await Otp.findOne({ email, otp });
    if (!validOtp) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    if (new Date() > validOtp.expiresAt) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create or Update User Database Record
    let user = await User.findOne({ email });
    
    if (user) {
      user.password = hashedPassword;
      user.name = name;
      user.isVerified = true;
      await user.save();
    } else {
      user = await User.create({
        email,
        name,
        password: hashedPassword,
        role: "student",
        isVerified: true,
      });
    }

    // Clean up OTP record post-verification
    await Otp.deleteMany({ email });

    return NextResponse.json({ success: true, message: "User registered successfully!" });

  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
