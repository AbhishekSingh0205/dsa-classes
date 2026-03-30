"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, X, UploadCloud, Save, ChevronDown, ChevronRight, ExternalLink, Link2 } from "lucide-react";

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  
  const [allProblems, setAllProblems] = useState<any[]>([]);
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  const [saving, setSaving] = useState(false);

  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);

  // New Problem Modal State
  const [showModal, setShowModal] = useState(false);
  const [newProbTitle, setNewProbTitle] = useState("");
  const [newProbLink, setNewProbLink] = useState("");
  const [newProbDiff, setNewProbDiff] = useState("Easy");
  const [newProbTopic, setNewProbTopic] = useState("");
  const [creatingProb, setCreatingProb] = useState(false);

  const groupedProblems = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    allProblems.forEach((p) => {
      const topicName = p.topic.split(", ")[0];
      if (!groups[topicName]) groups[topicName] = [];
      groups[topicName].push(p);
    });
    return groups;
  }, [allProblems]);

  const toggleTopic = (topic: string) => {
    setExpandedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [probRes, studentRes] = await Promise.all([
          fetch("/api/problems?limit=1000"),
          fetch("/api/users?role=student")
        ]);
        const probData = await probRes.json();
        const studentData = await studentRes.json();
        
        setAllProblems(probData.problems || []);
        setAllStudents(studentData.users || []);
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, [session, router]);

  if (status === "loading") {
    return <div className="p-8 text-center animate-pulse text-muted-foreground">Verifying access...</div>;
  }

  if (session?.user && (session.user as any).role !== "teacher") {
    return (
      <div className="p-8 max-w-md mx-auto mt-20 text-center space-y-4 bg-card border border-destructive/20 rounded-xl">
        <h2 className="text-2xl font-bold text-destructive">Access Denied</h2>
        <p className="text-muted-foreground">Only teachers have permission to create assignments.</p>
        <button 
          onClick={() => router.push("/assignments")} 
          className="mt-4 px-6 py-2 bg-secondary hover:bg-secondary/80 text-foreground transition-colors rounded-lg font-medium"
        >
          Return Home
        </button>
      </div>
    );
  }

  const toggleProblem = (id: string) => {
    setSelectedProblems((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!title) return alert("Title is required.");
    setSaving(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          problems: selectedProblems,
          attachments: [], 
          assignedTo: selectedStudents,
        }),
      });

      if (res.ok) {
        router.push("/assignments");
      } else {
        console.error(await res.text());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewProblem = async () => {
    if (!newProbTitle || !newProbLink || !newProbTopic) {
      return alert("Title, Link, and Topic are required.");
    }
    setCreatingProb(true);
    try {
      const res = await fetch("/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newProbTitle,
          link: newProbLink,
          topic: newProbTopic,
          difficulty: newProbDiff,
        }),
      });
      const data = await res.json();
      if (res.ok && data.problem) {
        setAllProblems(prev => [...prev, data.problem]);
        setSelectedProblems(prev => [...prev, data.problem._id]);
        setExpandedTopics(prev => prev.includes(data.problem.topic) ? prev : [...prev, data.problem.topic]);
        
        // Reset and close modal
        setShowModal(false);
        setNewProbTitle("");
        setNewProbLink("");
        setNewProbTopic("");
        setNewProbDiff("Easy");
      } else {
        alert(data.error || "Failed to create problem");
      }
    } catch (e) {
      console.error(e);
      alert("Error creating problem");
    } finally {
      setCreatingProb(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Assignment</h1>
        <p className="text-muted-foreground mt-1">Configure and assign problems to your students.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title <span className="text-destructive">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Week 1: Arrays and Hashing"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary resize-y"
              placeholder="Instructions for the assignment..."
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium">Assign To Students <span className="text-muted-foreground font-normal ml-1">({selectedStudents.length === 0 ? "Global" : `${selectedStudents.length} selected`})</span></label>
            <button
              onClick={() => {
                if (selectedStudents.length === allStudents.length) setSelectedStudents([]);
                else setSelectedStudents(allStudents.map(s => s._id));
              }}
              className="text-xs text-primary hover:underline font-medium"
            >
              {selectedStudents.length === allStudents.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          {allStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground border border-border p-4 rounded-lg bg-secondary/30 text-center">No students registered yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
              {allStudents.map(student => (
                <label key={student._id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedStudents.includes(student._id) ? "bg-primary/10 border-primary/30" : "bg-background border-border hover:bg-secondary"}`}>
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student._id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedStudents(prev => [...prev, student._id]);
                      else setSelectedStudents(prev => prev.filter(id => id !== student._id));
                    }}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{student.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{student.email}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium">Select Problems ({selectedProblems.length} selected)</label>
            <button 
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 bg-secondary text-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 transition-colors flex items-center gap-1.5 border border-border"
            >
              <Plus className="w-4 h-4" />
              Add New Problem
            </button>
          </div>
          
          <div className="w-full h-[400px] overflow-y-auto border border-border bg-background rounded-xl p-2 space-y-2">
            {Object.entries(groupedProblems).map(([topic, problems]) => {
              const selectedInTopic = problems.filter(p => selectedProblems.includes(p._id)).length;
              const isExpanded = expandedTopics.includes(topic);

              return (
                <div key={topic} className="border border-border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className="w-full flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <span className="font-semibold text-sm">{topic}</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded-full border border-border">
                      {selectedInTopic} / {problems.length} selected
                    </span>
                  </button>
                  
                  {isExpanded && (
                    <div className="p-2 space-y-1 bg-background">
                      {problems.map((prob: any) => (
                        <label
                          key={prob._id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedProblems.includes(prob._id) ? "bg-primary/10 border border-primary/20" : "hover:bg-secondary/50 border border-transparent"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedProblems.includes(prob._id)}
                            onChange={() => toggleProblem(prob._id)}
                            className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-sm">{prob.title}</div>
                            <div className="text-xs text-muted-foreground truncate">{prob.difficulty}</div>
                          </div>
                          <a
                            href={`/problems/${prob._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 text-muted-foreground hover:text-primary transition-colors bg-secondary/50 rounded-md hover:bg-secondary border border-border"
                            title="Open Problem to Add Teacher Note"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg font-medium text-muted-foreground hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !title}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Creating..." : "Create Assignment"}
          </button>
        </div>
      </div>

      {/* New Problem Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
              <h3 className="font-semibold text-lg">Add New Problem</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Problem Title <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={newProbTitle}
                  onChange={(e) => setNewProbTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="e.g. Two Sum"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">External Link <span className="text-destructive">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Link2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <input
                    type="url"
                    value={newProbLink}
                    onChange={(e) => setNewProbLink(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="https://leetcode.com/problems/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Topic <span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    value={newProbTopic}
                    onChange={(e) => setNewProbTopic(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="e.g. Arrays"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Difficulty <span className="text-destructive">*</span></label>
                  <select
                    value={newProbDiff}
                    onChange={(e) => setNewProbDiff(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-sm appearance-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-secondary/30 flex justify-end gap-2">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-lg transition-colors border border-transparent"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateNewProblem}
                disabled={creatingProb || !newProbTitle || !newProbLink || !newProbTopic}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {creatingProb ? "Adding..." : "Add Problem"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
