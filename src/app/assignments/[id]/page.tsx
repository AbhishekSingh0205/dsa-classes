"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ProblemTable, { ProblemWithProgress } from "@/components/ProblemTable";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import Link from "next/link";

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: session } = useSession();

  const [assignment, setAssignment] = useState<any>(null);
  const [problems, setProblems] = useState<ProblemWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const isTeacher = (session?.user as any)?.role === "teacher";

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/assignments/${id}`);
        if (!res.ok) {
          router.push("/assignments");
          return;
        }
        const data = await res.json();
        setAssignment(data.assignment);

        const assignedProbs = data.assignment.problems || [];
        
        let merged = assignedProbs.map((p: any) => ({
          ...p,
          hasTeacherNote: !!p.teacherNotes,
          hasStudentNote: false,
        }));

        if (!isTeacher) {
          const progRes = await fetch(`/api/progress?assignmentId=${id}`);
          const progData = await progRes.json();
          
          const progMap = new Map();
          (progData.progress || []).forEach((p: any) => {
            progMap.set((p.problemId?._id || p.problemId).toString(), p);
          });

          merged = merged.map((p: any) => {
            const prog = progMap.get(p._id.toString());
            return {
              ...p,
              solved: !!prog?.solved,
              hasStudentNote: !!prog?.notes,
            };
          });
        }

        setProblems(merged);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, router, isTeacher]);

  const handleToggleSolved = async (problemId: string, currentStatus: boolean) => {
    if (isTeacher) return;
    
    setProblems((prev) =>
      prev.map((p) => (p._id === problemId ? { ...p, solved: !currentStatus } : p))
    );

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId,
          assignmentId: id,
          solved: !currentStatus,
        }),
      });
    } catch (e) {
      console.error(e);
      setProblems((prev) =>
        prev.map((p) => (p._id === problemId ? { ...p, solved: currentStatus } : p))
      );
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-secondary rounded"></div>
        <div className="h-32 w-full bg-secondary rounded-xl"></div>
        <div className="h-64 w-full bg-secondary rounded-xl"></div>
      </div>
    );
  }

  if (!assignment) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/assignments" className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{assignment.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            {assignment.dueDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Due: {new Date(assignment.dueDate).toLocaleDateString()}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              {problems.length} Problems
            </span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-2">Description / Instructions</h3>
        <p className="text-muted-foreground whitespace-pre-wrap">
          {assignment.description || "No specific instructions provided."}
        </p>
        
        {assignment.attachments && assignment.attachments.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="font-semibold mb-3">Attachments & PDFs</h4>
            <div className="flex flex-wrap gap-3">
              {assignment.attachments.map((att: any) => (
                <a
                  key={att._id}
                  href={`data:application/pdf;base64,${att.pdfData}`}
                  download={att.name}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  {att.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Assigned Problems</h3>
        <p className="text-sm text-muted-foreground">Click a problem title to open the editor and solve it.</p>
        <ProblemTable
          problems={problems}
          onToggleSolved={handleToggleSolved}
          isLoading={false}
        />
      </div>
    </div>
  );
}
