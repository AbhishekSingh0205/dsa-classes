"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Code2, User, GraduationCap, Mail, Lock } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const registered = searchParams.get("registered");

  const [submitting, setSubmitting] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [teacherEmail] = useState("teacher@testdsa.com");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-pulse">Loading auth state...</div>
      </div>
    );
  }

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentEmail || !studentPassword) return setErrorText("Email and password required.");
    
    setErrorText("");
    setSubmitting("student");
    
    const res = await signIn("credentials", {
      email: studentEmail,
      password: studentPassword,
      callbackUrl,
      redirect: false,
    });
    
    if (res?.error) {
      setErrorText(res.error || "Invalid credentials!");
      setSubmitting("");
    } else if (res?.url) {
      router.push(res.url);
    }
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherPassword) return setErrorText("Please enter the teacher password.");
    
    setErrorText("");
    setSubmitting("teacher");
    
    const res = await signIn("credentials", {
      email: teacherEmail,
      password: teacherPassword,
      callbackUrl,
      redirect: false,
    });
    
    if (res?.error) {
      setErrorText("Invalid teacher credentials!");
      setSubmitting("");
    } else if (res?.url) {
      router.push(res.url);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl border border-border shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-2">
            <Code2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">DSA Tracker</h1>
        </div>

        {registered && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-semibold text-center rounded-xl">
            Account verified successfully! You can now sign in.
          </div>
        )}

        <div className="space-y-4 pt-2 border-t border-border">
          <h2 className="text-sm font-semibold text-center text-muted-foreground uppercase tracking-wider">Student Login</h2>
          
          <div className="space-y-4">
            {errorText && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold text-center rounded-xl">
                {errorText}
              </div>
            )}
            
            <form onSubmit={handleStudentLogin} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Student Email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50 transition-all font-medium"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Password"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50 transition-all font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={!!submitting}
                className="w-full flex items-center justify-center gap-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border py-3.5 rounded-xl font-medium transition-colors disabled:opacity-50 mt-2"
              >
                <User className="w-5 h-5 text-primary" />
                {submitting === "student" ? "Signing In..." : "Sign In"}
              </button>
            </form>
            
            <div className="text-center text-sm font-medium text-muted-foreground pt-1">
              Need an account?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Register Here
              </Link>
            </div>

            <div className="pt-2">
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase font-semibold">Teacher Access</span>
                <div className="flex-grow border-t border-border"></div>
              </div>
              
              <form onSubmit={handleTeacherLogin} className="space-y-3 mt-2">
                <input
                  type="password"
                  placeholder="Enter teacher password"
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50 transition-all font-medium text-center"
                />
                <button
                  type="submit"
                  disabled={!!submitting}
                  className="w-full flex items-center justify-center gap-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border py-3.5 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  <GraduationCap className="w-5 h-5 text-primary" />
                  {submitting === "teacher" ? "Signing In..." : "Sign In as Teacher"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
