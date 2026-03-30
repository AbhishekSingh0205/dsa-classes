"use client";

import React, { useState, useEffect, useMemo } from "react";
import Fuse from "fuse.js";
import ProblemTable, { ProblemWithProgress } from "@/components/ProblemTable";
import { Search, ChevronLeft, BookOpen, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function ProblemsPage() {
  const { data: session } = useSession();
  const [problems, setProblems] = useState<ProblemWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [probRes, progRes] = await Promise.all([
          // Request a high limit to get all metadata for grouping
          fetch("/api/problems?limit=1000"),
          fetch("/api/progress"),
        ]);
        
        const probData = await probRes.json();
        const progData = await progRes.json();

        const progMap = new Map();
        (progData.progress || []).forEach((p: any) => {
          progMap.set((p.problemId?._id || p.problemId).toString(), p);
        });

        const merged = (probData.problems || []).map((p: any) => {
          const prog = progMap.get(p._id.toString());
          return {
            ...p,
            solved: !!prog?.solved,
            hasTeacherNote: !!p.teacherNotes,
            hasStudentNote: !!prog?.notes,
          };
        });

        setProblems(merged);
      } catch (error) {
        console.error("Failed to load problems", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleToggleSolved = async (problemId: string, currentStatus: boolean) => {
    // Optimistic update
    setProblems((prev) =>
      prev.map((p) => (p._id === problemId ? { ...p, solved: !currentStatus } : p))
    );

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, solved: !currentStatus }),
      });
    } catch (e) {
      console.error("Failed to update status", e);
      setProblems((prev) =>
        prev.map((p) => (p._id === problemId ? { ...p, solved: currentStatus } : p))
      );
    }
  };

  // Group problems by topic
  const topicGroups = useMemo(() => {
    const groups: Record<string, { total: number; solved: number; problems: ProblemWithProgress[] }> = {};
    const orderedTopics: string[] = [];

    problems.forEach((p) => {
      if (!groups[p.topic]) {
        groups[p.topic] = { total: 0, solved: 0, problems: [] };
        orderedTopics.push(p.topic);
      }
      groups[p.topic].problems.push(p);
      groups[p.topic].total += 1;
      if (p.solved) groups[p.topic].solved += 1;
    });

    // orderedTopics keeps the natural chronological order from the database 'order' field
    return orderedTopics.map((topic) => ({
      name: topic,
      ...groups[topic]
    }));
  }, [problems]);

  // Handle Search Filtering
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const fuse = new Fuse(problems, {
      keys: ["title", "topic"],
      threshold: 0.3,
    });
    return fuse.search(searchQuery).map((res) => res.item);
  }, [problems, searchQuery]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Paths</h1>
          <p className="text-muted-foreground mt-1">Master DSA block by block.</p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search all problems..."
            className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground animate-pulse">
          Loading learning paths...
        </div>
      ) : searchResults ? (
        /* Search Mode Active */
        <div className="space-y-4">
          <h2 className="text-lg font-semibold px-1">Search Results ({searchResults.length})</h2>
          <ProblemTable
            problems={searchResults}
            onToggleSolved={handleToggleSolved}
          />
        </div>
      ) : activeTopic ? (
        /* Active Topic Detail View */
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTopic(null)}
              className="p-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors border border-border"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold">{activeTopic}</h2>
              <p className="text-muted-foreground text-sm">
                Complete all problems below to master this topic.
              </p>
            </div>
          </div>
          <ProblemTable
            problems={topicGroups.find(t => t.name === activeTopic)?.problems || []}
            onToggleSolved={handleToggleSolved}
          />
        </div>
      ) : (
        /* Topic Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topicGroups.map((topic) => {
            const progressPct = Math.round((topic.solved / topic.total) * 100) || 0;
            const isCompleted = topic.solved === topic.total;

            return (
              <div 
                key={topic.name}
                onClick={() => setActiveTopic(topic.name)}
                className={`group relative bg-card p-6 rounded-2xl border transition-all cursor-pointer overflow-hidden
                  ${isCompleted 
                    ? "border-green-500/50 hover:border-green-500" 
                    : "border-border hover:border-primary/50 hover:shadow-md"
                  }
                `}
              >
                {/* Background progress fill */}
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full"
                >
                  <div 
                    className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-primary'} transition-all duration-1000 ease-out`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${isCompleted ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-muted-foreground">{progressPct}%</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold group-hover:text-primary transition-colors pr-2 truncate">
                  {topic.name}
                </h3>
                
                <p className="text-sm text-muted-foreground mt-2">
                  {topic.solved} / {topic.total} problems solved
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
