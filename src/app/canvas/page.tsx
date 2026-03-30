"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Presentation, Clock, ChevronRight, Trash2, Pencil } from "lucide-react";

export default function CanvasListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [canvases, setCanvases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const isTeacher = (session?.user as any)?.role === "teacher";

  useEffect(() => {
    async function loadData() {
      try {
        const roleQuery = isTeacher ? "?role=teacher" : "?role=student";
        const res = await fetch(`/api/canvas${roleQuery}`);
        const data = await res.json();
        setCanvases(data.canvases || []);
      } catch (e) {
        console.error("Failed to load canvases", e);
      } finally {
        setLoading(false);
      }
    }
    
    if (status !== "loading") {
      loadData();
    }
  }, [status, isTeacher]);

  const handleCreateCanvas = async () => {
    const title = prompt("Enter a name for your new canvas:");
    if (!title) return; // User cancelled
    
    setCreating(true);
    try {
      const res = await fetch("/api/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (data.canvas) {
        router.push(`/canvas/${data.canvas._id}`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to create canvas.");
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this canvas permanently?")) return;

    try {
      await fetch(`/api/canvas?id=${id}`, { method: "DELETE" });
      setCanvases(canvases.filter(c => c._id !== id));
    } catch (error) {
      console.error(error);
      alert("Failed to delete canvas.");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-pulse text-muted-foreground flex items-center gap-3">
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          Loading Canvases...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20 fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Virtual Classrooms</h1>
          <p className="text-muted-foreground mt-1">
            {isTeacher ? "Create and manage your interactive teaching sessions." : "View active learning sessions."}
          </p>
        </div>

        {isTeacher && (
          <button
            onClick={handleCreateCanvas}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            {creating ? "Creating..." : "Create Canvas"}
          </button>
        )}
      </div>

      {canvases.length === 0 ? (
        <div className="w-full h-64 flex flex-col items-center justify-center text-muted-foreground bg-secondary/20 rounded-xl border border-border border-dashed space-y-4">
          <Presentation className="w-12 h-12 opacity-50" />
          <p>No canvases found.</p>
          {isTeacher && (
            <button onClick={handleCreateCanvas} className="text-primary hover:underline font-medium">
              Start your first session
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {canvases.map((canvas) => (
            <Link key={canvas._id} href={`/canvas/${canvas._id}`} className="block group relative">
              <div className="bg-card text-card-foreground p-5 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow h-full flex flex-col gap-4">
                
                {isTeacher && (
                  <button 
                    onClick={(e) => handleDelete(e, canvas._id)}
                    className="absolute top-4 right-4 p-2 bg-destructive/10 text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white z-20"
                    title="Delete Canvas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="flex items-start justify-between pr-8">
                  <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                    {canvas.title}
                  </h3>
                </div>
                
                <div className="mt-auto flex flex-col gap-3">
                  {isTeacher && (
                    <div className="w-fit">
                      {canvas.isPublished ? (
                        <span className="text-xs font-semibold px-2 py-1 bg-green-500/20 text-green-500 rounded-md">
                          Published
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-1 bg-yellow-500/20 text-yellow-500 flex items-center gap-1 rounded-md">
                          <Pencil className="w-3 h-3"/> Draft
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground w-full justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Intl.DateTimeFormat('en-US', { 
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: 'numeric', minute: 'numeric'
                        }).format(new Date(canvas.publishedAt))}
                      </span>
                    </div>
                    {!isTeacher && (
                      <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-5 h-5 text-primary" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
