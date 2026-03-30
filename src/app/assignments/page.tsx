"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AssignmentCard from "@/components/AssignmentCard";
import Link from "next/link";
import { Plus, CheckCircle, Clock } from "lucide-react";

export default function AssignmentsPage() {
  const { data: session, status } = useSession();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [solvedSet, setSolvedSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const isTeacher = (session?.user as any)?.role === "teacher";

  useEffect(() => {
    async function fetchData() {
      try {
        const [assignRes, progRes] = await Promise.all([
          fetch("/api/assignments"),
          !isTeacher ? fetch("/api/progress") : Promise.resolve(null),
        ]);
        
        const assignData = await assignRes.json();
        setAssignments(assignData.assignments || []);

        if (!isTeacher && progRes) {
          const progData = await progRes.json();
          const solvedIds = (progData.progress || [])
            .filter((p: any) => p.solved)
            .map((p: any) => p.problemId?._id || p.problemId);
          setSolvedSet(new Set(solvedIds));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isTeacher]);

  // Derived state for Student split view
  const pendingAssignments: any[] = [];
  const completedAssignments: any[] = [];

  if (!isTeacher) {
    assignments.forEach((assignment) => {
      // Check if all problems in this assignment are solved
      const totalProbs = assignment.problems?.length || 0;
      let solvedCount = 0;
      
      assignment.problems?.forEach((prob: any) => {
        const probId = typeof prob === "string" ? prob : prob._id;
        if (solvedSet.has(probId)) solvedCount++;
      });

      if (totalProbs > 0 && solvedCount === totalProbs) {
        completedAssignments.push(assignment);
      } else {
        pendingAssignments.push(assignment);
      }
    });
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground mt-1">
            {isTeacher ? "Manage your class assignments." : "View and complete your assigned tasks."}
          </p>
        </div>

        {isTeacher && (
          <Link
            href="/assignments/create"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Create Assignment
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-card rounded-xl border border-border"></div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="w-full h-64 flex flex-col items-center justify-center text-muted-foreground bg-secondary/20 rounded-xl border border-border border-dashed space-y-4">
          <p>No assignments found.</p>
          {isTeacher && (
            <Link href="/assignments/create" className="text-primary hover:underline font-medium">
              Create your first assignment
            </Link>
          )}
        </div>
      ) : isTeacher ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment._id}
              assignment={assignment}
              isStudent={false}
              completionRate={assignment.completionRate || 0}
            />
          ))}
        </div>
      ) : (
        /* Student Split View */
        <div className="space-y-12">
          {/* Pending Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Pending Assignments
            </h2>
            {pendingAssignments.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">All caught up! No pending assignments.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingAssignments.map((assignment) => (
                  <AssignmentCard key={assignment._id} assignment={assignment} isStudent={true} />
                ))}
              </div>
            )}
          </div>

          {/* Completed Section */}
          {completedAssignments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Completed Assignments
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedAssignments.map((assignment) => (
                  <AssignmentCard key={assignment._id} assignment={assignment} isStudent={true} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
