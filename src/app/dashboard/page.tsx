import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Problem } from "@/models/Problem";
import { StudentProgress } from "@/models/StudentProgress";
import StatsCard from "@/components/StatsCard";
import { Target, Trophy, FileCode2, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  await connectDB();
  const dbUser = await User.findOne({ email: session.user.email });
  if (!dbUser) redirect("/auth/signin");

  const isTeacher = dbUser.role === "teacher";

  // Calculate stats
  const totalProblems = await Problem.countDocuments();
  let totalSolved = 0;
  let easySolved = 0;
  let mediumSolved = 0;
  let hardSolved = 0;

  if (!isTeacher) {
    const solvedProgress = await StudentProgress.find({ 
      studentId: dbUser._id, 
      solved: true 
    }).populate("problemId");

    totalSolved = solvedProgress.length;
    
    solvedProgress.forEach(p => {
      const difficulty = (p.problemId as any)?.difficulty;
      if (difficulty === "Easy") easySolved++;
      if (difficulty === "Medium") mediumSolved++;
      if (difficulty === "Hard") hardSolved++;
    });
  }

  const completionPercent = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {dbUser.name}</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            {isTeacher ? "Here's an overview of your classes & assignments." : "Here's your progress so far. Keep it up!"}
          </p>
        </div>
      </div>

      {!isTeacher && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Solved"
              value={`${totalSolved} / ${totalProblems}`}
              icon={<Trophy className="w-5 h-5 text-yellow-500" />}
              description={`${completionPercent}% completion rate`}
            />
            <StatsCard
              title="Easy Problems"
              value={easySolved}
              icon={<Target className="w-5 h-5 text-green-500" />}
            />
            <StatsCard
              title="Medium Problems"
              value={mediumSolved}
              icon={<FileCode2 className="w-5 h-5 text-yellow-500" />}
            />
            <StatsCard
              title="Hard Problems"
              value={hardSolved}
              icon={<TrendingUp className="w-5 h-5 text-red-500" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Overall Progress</h3>
              <div className="space-y-4">
                <div className="w-full bg-secondary h-4 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-1000 ease-out"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0%</span>
                  <span>{completionPercent}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground bg-secondary/30 rounded-xl border border-dashed border-border text-sm">
                No recent activity to show.
              </div>
            </div>
          </div>
        </>
      )}

      {isTeacher && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center min-h-[200px] text-center space-y-4">
            <h3 className="font-semibold text-xl text-primary">Manage Assignments</h3>
            <p className="text-muted-foreground text-sm max-w-sm">Create and track assignments for your students. Upload resources and monitor their completion rates.</p>
            <a href="/assignments" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Go to Assignments
            </a>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center min-h-[200px] text-center space-y-4">
            <h3 className="font-semibold text-xl text-primary">Interactive Canvas</h3>
            <p className="text-muted-foreground text-sm max-w-sm">Use the tldraw canvas to draw diagrams, explain algorithms, and share them with the class.</p>
            <a href="/canvas" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Go to Canvas
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
