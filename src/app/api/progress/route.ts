import { connectDB } from "@/lib/mongodb";
import { StudentProgress } from "@/models/StudentProgress";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Problem } from "@/models/Problem";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const assignmentId = searchParams.get("assignmentId");

  const userId = (session.user as Record<string, unknown>).id as string;
  const role = (session.user as Record<string, unknown>).role as string;

  const filter: Record<string, unknown> = {};
  if (role === "teacher" && studentId) {
    filter.studentId = studentId;
  } else {
    filter.studentId = userId;
  }
  if (assignmentId) filter.assignmentId = assignmentId;

  const progress = await StudentProgress.find(filter)
    .populate("problemId")
    .sort({ solvedAt: -1 });

  return NextResponse.json({ progress });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  await connectDB();

  const userId = (session.user as Record<string, unknown>).id as string;

  // 1. Find all duplicate problems that share the same link
  let problemIds = [body.problemId];
  try {
    const problem = await Problem.findById(body.problemId);
    if (problem && problem.link) {
      const dups = await Problem.find({ link: problem.link });
      problemIds = [...new Set(dups.map((d: any) => d._id.toString()))];
    }
  } catch (e) {
    console.error("Failed to find duplicates, proceeding with single ID", e);
  }

  const savedRecords = [];

  for (const pid of problemIds) {
    // We always want to update the GLOBAL record ($exists: false) for ALL these problem IDs
    const globalQuery = { studentId: userId, problemId: pid, assignmentId: { $exists: false } };
    
    let globalExisting = await StudentProgress.findOne(globalQuery);
    let globalProg;
    
    if (globalExisting) {
      globalProg = await StudentProgress.findByIdAndUpdate(
        globalExisting._id,
        { ...body, problemId: pid, assignmentId: undefined, solvedAt: body.solved ? new Date() : null },
        { new: true }
      );
    } else {
      globalProg = await StudentProgress.create({
        ...body,
        studentId: userId,
        problemId: pid,
        assignmentId: undefined,
        solvedAt: body.solved ? new Date() : null,
      });
    }
    
    if (pid === body.problemId) savedRecords.push(globalProg);

    // If they came from an assignment, ALSO update that specific assignment record
    if (body.assignmentId && pid === body.problemId) {
      const assignmentQuery = { studentId: userId, problemId: pid, assignmentId: body.assignmentId };
      let assignExisting = await StudentProgress.findOne(assignmentQuery);
      
      let assignProg;
      if (assignExisting) {
        assignProg = await StudentProgress.findByIdAndUpdate(
          assignExisting._id,
          { ...body, solvedAt: body.solved ? new Date() : null },
          { new: true }
        );
      } else {
        assignProg = await StudentProgress.create({
          ...body,
          studentId: userId,
          solvedAt: body.solved ? new Date() : null,
        });
      }
      savedRecords.push(assignProg);
    }
  }

  // Return the first saved record representing the primary request
  return NextResponse.json({ progress: savedRecords[0] }, { status: 201 });
}
