"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import CanvasEngine from "@/components/canvas/CanvasEngine";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function CanvasViewerPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const [initialState, setInitialState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isTeacher = (session?.user as any)?.role === "teacher";

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/canvas?id=${params.id}`);
        const data = await res.json();
        
        if (data.canvas?.state) {
          setInitialState(data.canvas.state);
        } else {
          setInitialState({ background: "#1a1a1a", elements: [] }); // blank canvas fallback
        }
      } catch (e) {
        console.error("Failed to load canvas data", e);
      } finally {
        setLoading(false);
      }
    }
    
    if (status !== "loading") {
      loadData();
    }
  }, [status, params.id]);

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-pulse text-muted-foreground flex items-center gap-3">
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          Loading Canvas...
        </div>
      </div>
    );
  }

  // Both Teacher and Student share full width boundary space to eliminate coordinate bleed cutoffs
  const containerClass = "w-full h-full";

  return (
    <div className={`h-screen overflow-hidden bg-secondary/10 flex flex-col ${isTeacher ? '' : 'p-4 pb-0'}`}>
      
      {/* Back to Dashboard Navigation */}
      <div className="absolute top-4 left-4 z-50">
        <Link 
          href="/canvas"
          className="flex items-center gap-2 bg-card text-card-foreground border border-border px-3 py-2 rounded-xl text-sm font-medium shadow-sm hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to List
        </Link>
      </div>

      <div className={`relative bg-background rounded-t-xl overflow-hidden flex-1 ${containerClass}`}>
        <CanvasEngine 
          initialState={initialState} 
          isTeacher={isTeacher} 
          canvasId={params.id}
        />
      </div>
    </div>
  );
}
