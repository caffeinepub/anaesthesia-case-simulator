import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Debrief as DebriefType, Scenario } from "../backend.d";
import { useGetDebrief, useResetSession } from "../hooks/useQueries";

interface DebriefProps {
  sessionId: bigint;
  scenario: Scenario;
  onReset: () => void;
}

const GUIDELINE_BADGE: Record<string, string> = {
  DAS: "bg-blue-900/60 text-blue-300 border-blue-600/40",
  AAGBI: "bg-emerald-900/60 text-emerald-300 border-emerald-600/40",
  ASA: "bg-orange-900/60 text-orange-300 border-orange-600/40",
  ESAIC: "bg-purple-900/60 text-purple-300 border-purple-600/40",
};

function guidelineBadgeClass(ref: string): string {
  const key = Object.keys(GUIDELINE_BADGE).find((k) =>
    ref.toUpperCase().includes(k),
  );
  return key
    ? GUIDELINE_BADGE[key]
    : "bg-muted text-muted-foreground border-border";
}

function getRating(pct: number): {
  label: string;
  icon: React.ReactNode;
  color: string;
} {
  if (pct >= 85)
    return {
      label: "Excellent",
      icon: <Trophy className="w-6 h-6" />,
      color: "text-amber-400",
    };
  if (pct >= 70)
    return {
      label: "Good",
      icon: <Target className="w-6 h-6" />,
      color: "text-emerald-400",
    };
  return {
    label: "Needs Review",
    icon: <AlertCircle className="w-6 h-6" />,
    color: "text-orange-400",
  };
}

export default function Debrief({
  sessionId,
  scenario,
  onReset,
}: DebriefProps) {
  const [debrief, setDebrief] = useState<DebriefType | null>(null);
  const fetchedRef = useRef(false);
  const getDebrief = useGetDebrief();
  const resetSession = useResetSession();

  // Fetch debrief once on mount
  if (!fetchedRef.current) {
    fetchedRef.current = true;
    getDebrief.mutate(sessionId, {
      onSuccess: (data) => setDebrief(data),
      onError: () => toast.error("Failed to load debrief."),
    });
  }

  function handleReset() {
    resetSession.mutate(sessionId, {
      onSuccess: () => onReset(),
      onError: () => {
        onReset();
      },
    });
  }

  if (getDebrief.isPending || !debrief) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          data-ocid="debrief.loading_state"
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-muted-foreground font-mono text-sm">
            Loading debrief...
          </p>
        </div>
      </div>
    );
  }

  const correct = Number(debrief.score.correct);
  const total = Number(debrief.score.total);
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const rating = getRating(pct);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="font-display font-bold text-sm">Case Debrief</h1>
          <Button
            data-ocid="restart.primary_button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={resetSession.isPending}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            New Case
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          data-ocid="debrief.panel"
          className="space-y-8"
        >
          {/* Score summary */}
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex-1">
                <p className="text-[11px] font-mono text-muted-foreground tracking-widest mb-1">
                  {scenario.title.toUpperCase()}
                </p>
                <h2 className="font-display text-3xl font-bold mb-4">
                  Case Complete
                </h2>
                <div className="flex items-center gap-3 mb-3">
                  <span className={cn("flex items-center gap-2", rating.color)}>
                    {rating.icon}
                    <span className="font-display font-bold text-xl">
                      {rating.label}
                    </span>
                  </span>
                </div>
                <Progress value={pct} className="h-3 mb-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {correct} correct of {total} steps
                  </span>
                  <span className="font-mono font-bold text-primary">
                    {pct}%
                  </span>
                </div>
              </div>
              <div className="text-center shrink-0">
                <div className="w-24 h-24 rounded-full border-2 border-primary/40 flex items-center justify-center monitor-bg">
                  <span className="font-mono text-3xl font-bold text-primary">
                    {correct}/{total}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step breakdown */}
          <div>
            <h3 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              Step-by-Step Review
            </h3>
            <div className="space-y-4">
              {debrief.steps.map((step, idx) => {
                const ocidMap = [
                  "debrief.item.1",
                  "debrief.item.2",
                  "debrief.item.3",
                ] as const;
                const ocid = idx < 3 ? ocidMap[idx] : undefined;
                const wasCorrect =
                  step.chosenAnswer.id === step.correctAnswer.id;
                return (
                  <motion.div
                    key={String(step.stepId)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06, duration: 0.3 }}
                    data-ocid={ocid}
                    className={cn(
                      "rounded-lg border p-5 space-y-3",
                      wasCorrect
                        ? "border-emerald-700/40 bg-emerald-950/20"
                        : "border-red-700/40 bg-red-950/20",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {wasCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        )}
                        <span className="text-[11px] font-mono text-muted-foreground tracking-widest">
                          STEP {idx + 1}
                        </span>
                      </div>
                      {step.guidelineRef && (
                        <span
                          className={cn(
                            "text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0",
                            guidelineBadgeClass(step.guidelineRef),
                          )}
                        >
                          {step.guidelineRef}
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-[11px] font-mono text-muted-foreground mb-1">
                        YOUR ANSWER
                      </p>
                      <p
                        className={cn(
                          "text-sm rounded px-3 py-2 border",
                          wasCorrect
                            ? "text-emerald-300 bg-emerald-950/40 border-emerald-700/30"
                            : "text-red-300 bg-red-950/40 border-red-700/30",
                        )}
                      >
                        {step.chosenAnswer.text}
                      </p>
                    </div>

                    {!wasCorrect && (
                      <div>
                        <p className="text-[11px] font-mono text-muted-foreground mb-1">
                          CORRECT ANSWER
                        </p>
                        <p className="text-sm text-emerald-300 rounded px-3 py-2 bg-emerald-950/40 border border-emerald-700/30">
                          {step.correctAnswer.text}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.explanation}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              data-ocid="restart.primary_button"
              size="lg"
              onClick={handleReset}
              disabled={resetSession.isPending}
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Start New Case
            </Button>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-border mt-12 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
