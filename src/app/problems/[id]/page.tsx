"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CodeEditor from "@/components/CodeEditor";
import { CheckCircle, ExternalLink, Save, ArrowLeft, Users, FileText } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function ProblemDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();

  const [problem, setProblem] = useState<any>(null);
  
  // Student State
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [notes, setNotes] = useState("");
  const [hints, setHints] = useState("");
  const [solved, setSolved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Teacher State & Storage
  const [studentTracking, setStudentTracking] = useState<any[]>([]);
  const [teacherPersonalNote, setTeacherPersonalNote] = useState("");

  const isTeacher = (session?.user as any)?.role === "teacher";

  useEffect(() => {
    async function loadData() {
      try {
        const probRes = await fetch(`/api/problems`);
        const probData = await probRes.json();
        const found = probData.problems?.find((p: any) => p._id === id);
        setProblem(found);

        if (isTeacher) {
          // Load Teacher Tracking Data
          const trackRes = await fetch(`/api/teacher/progress?problemId=${id}`);
          const trackData = await trackRes.json();
          setStudentTracking(trackData.tracking || []);
          
          if (found?.teacherNotes) {
            setTeacherPersonalNote(found.teacherNotes);
          }
          
        } else {
          // Load Student Progress
          const progRes = await fetch(`/api/progress`);
          const progData = await progRes.json();
          const p = progData.progress?.find((p: any) => 
            (p.problemId?._id || p.problemId) === id && !p.assignmentId
          );
          
          if (p) {
            setCode(p.code || "");
            setLanguage(p.codeLanguage || "javascript");
            setNotes(p.notes || "");
            setHints(p.hints || "");
            setSolved(p.solved || false);
          }
        }
      } catch (err) {
        console.error("Failed to load problem data", err);
      }
    }
    loadData();
  }, [id, isTeacher]);

  const handleSaveStudent = async () => {
    setSaving(true);
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: id,
          code,
          codeLanguage: language,
          notes,
          hints,
          solved,
        }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  };

  const handleSaveTeacherNote = async () => {
    try {
      await fetch(`/api/problems/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherNotes: teacherPersonalNote }),
      });
      alert("Teacher note saved securely!");
    } catch(e) {
      console.error(e);
      alert("Failed to save note.");
    }
  };

  if (!problem) {
    return (
      <div className="p-8 max-w-7xl mx-auto animate-pulse flex flex-col gap-4">
        <div className="w-48 h-8 bg-secondary rounded"></div>
        <div className="w-full h-[600px] bg-secondary rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-h-screen">
      {/* HEADER */}
      <div className="p-4 border-b border-border bg-card flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/problems" className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-3">
              {problem.title}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              <span className="uppercase font-bold tracking-wider">{problem.difficulty}</span>
              <span>•</span>
              <span className="truncate max-w-[300px]">{problem.topic}</span>
              <span>•</span>
              <a href={problem.link} target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-1">
                LeetCode <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {!isTeacher && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSolved(!solved)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors \${
                solved ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {solved ? "Solved" : "Mark Solved"}
            </button>
            <button
              onClick={handleSaveStudent}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Progress"}
            </button>
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="flex-1 flex overflow-hidden">
        {isTeacher ? (
          /* TEACHER DASHBOARD VIEW */
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-background">
            
            {/* Left side: Student Tracking Table */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Class Progress Dashboard</h2>
              </div>
              
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-medium">Student Name</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Student Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {studentTracking.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                          No students found.
                        </td>
                      </tr>
                    ) : (
                      studentTracking.map((record) => (
                        <tr key={record.student.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-4 font-medium">{record.student.name}</td>
                          <td className="px-4 py-4">
                            {record.solved ? (
                              <span className="inline-flex items-center gap-1 text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full text-xs font-semibold">
                                <CheckCircle className="w-3.5 h-3.5" /> Solved
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-muted-foreground bg-secondary px-2.5 py-1 rounded-full text-xs font-semibold">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-muted-foreground max-w-sm">
                            {record.notes ? (
                              <div className="line-clamp-2 italic">&quot;{record.notes}&quot;</div>
                            ) : (
                              <span className="opacity-50">No notes provided.</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right side: Teacher's Personal Notes */}
            <div className="w-full lg:w-[400px] bg-card border-l border-border flex flex-col p-6 shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Teacher&apos;s Private Notes</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Leave a global note for this problem. Students will see a TN badge when you leave a note!
              </p>
              <textarea
                value={teacherPersonalNote}
                onChange={(e) => setTeacherPersonalNote(e.target.value)}
                placeholder="Write your notes here..."
                className="flex-1 w-full bg-secondary/30 border border-border rounded-xl p-4 resize-none outline-none focus:ring-2 focus:ring-primary text-sm mb-4"
              />
              <button 
                onClick={handleSaveTeacherNote}
                className="w-full py-2.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Teacher Note
              </button>
            </div>
            
          </div>
        ) : (
          /* STUDENT CODE EDITOR VIEW */
          <>
            <div className="flex-1 flex flex-col border-r border-border min-w-[50%]">
              <div className="p-2 bg-secondary/30 flex items-center justify-between border-b border-border shrink-0">
                <div className="flex items-center gap-2 px-2">
                  <span className="text-sm font-medium text-muted-foreground">Editor</span>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-card border border-border text-sm rounded-md px-3 py-1 outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
              <div className="flex-1 overflow-hidden p-2 bg-background">
                <CodeEditor
                  code={code}
                  language={language}
                  onChange={(val) => val !== undefined && setCode(val)}
                  readOnly={false}
                />
              </div>
            </div>

            <div className="w-[400px] flex flex-col bg-card shrink-0 h-full overflow-y-auto">
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-2">My Notes</h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write down your approach, time/space complexity..."
                    className="w-full h-[300px] p-4 bg-secondary/30 border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-inner"
                  />
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold mb-2">Hints / Edge Cases</h3>
                  <textarea
                    value={hints}
                    onChange={(e) => setHints(e.target.value)}
                    placeholder="Important edge cases or hints..."
                    className="w-full h-[150px] p-4 bg-secondary/30 border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-inner"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
