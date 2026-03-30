import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { connectDB } from "@/lib/mongodb";
import { Otp } from "@/models/Otp";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return NextResponse.json({ error: "Email already registered and verified" }, { status: 400 });
    }

    // Generate 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in DB, overwriting any previous OTP for clarity
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp: otpCode, expiresAt });

    // Nodemailer Ethereal/SMTP Setup
    let transporter;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: process.env.EMAIL_PORT === "465",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
    } else {
      console.log("No SMTP credentials found in .env. Using Ethereal Mock Email...");
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    }

    const info = await transporter.sendMail({
      from: `DSA Tracker Academy <${process.env.EMAIL_USER || "noreply@dsatracker.com"}>`,
      to: email,
      subject: "Your Registration OTP Code",
      text: `Your verification code is: ${otpCode}. It expires in 10 minutes.`,
      html: `<h3>Welcome to DSA Tracker Academy!</h3><p>Your verification code is: <strong>${otpCode}</strong></p><p>It will expire in 10 minutes.</p>`,
    });

    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    console.log(`[DEV ONLY] The OTP for ${email} is: ${otpCode}`);

    return NextResponse.json({ 
      success: true, 
      message: "OTP sent successfully! Check server console if using mocked email." 
    });

  } catch (error) {
    console.error("OTP Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
