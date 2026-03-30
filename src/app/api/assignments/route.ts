import { connectDB } from "@/lib/mongodb";
import { Assignment } from "@/models/Assignment";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { User } from "@/models/User";
import { StudentProgress } from "@/models/StudentProgress";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const userId = (session.user as Record<string, unknown>).id as string;
  const role = (session.user as Record<string, unknown>).role as string;

  let assignments;
  
  if (role === "teacher") {
    const rawAssignments = await Assignment.find({ teacherId: userId })
      .populate("problems")
      .sort({ createdAt: -1 });

    const totalStudents = await User.countDocuments({ role: "student" });
    assignments = [];

    for (let assign of rawAssignments) {
      const assignObj = assign.toObject();
      const totalProblems = assignObj.problems?.length || 0;
      
      if (totalStudents === 0 || totalProblems === 0) {
        assignObj.completionRate = 0;
      } else {
        const expectedSolveCount = totalStudents * totalProblems;
        const actualSolveCount = await StudentProgress.countDocuments({
          assignmentId: assignObj._id,
          solved: true
        });
        assignObj.completionRate = Math.round((actualSolveCount / expectedSolveCount) * 100);
      }
      assignments.push(assignObj);
    }
  } else {
    // Student Logic
    const filter = {
      $or: [
        { assignedTo: { $size: 0 } }, 
        { assignedTo: { $exists: false } },
        { assignedTo: userId }
      ]
    };

    assignments = await Assignment.find(filter)
      .populate("problems")
      .populate("teacherId", "name email image")
      .sort({ createdAt: -1 });
  }

  return NextResponse.json({ assignments });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as Record<string, unknown>).role as string;
  if (role !== "teacher") {
    return NextResponse.json({ error: "Only teachers can create assignments" }, { status: 403 });
  }

  const body = await req.json();
  await connectDB();

  const userId = (session.user as Record<string, unknown>).id as string;
  const assignment = await Assignment.create({
    ...body,
    teacherId: userId,
  });

  return NextResponse.json({ assignment }, { status: 201 });
}
