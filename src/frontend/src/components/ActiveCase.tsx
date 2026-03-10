import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { CaseStep, Scenario, StepResult, Vitals } from "../backend.d";
import { useGetStep, useSubmitAnswer } from "../hooks/useQueries";
import PatientMonitor from "./PatientMonitor";

interface ActiveCaseProps {
  sessionId: bigint;
  scenario: Scenario;
  initialStep: CaseStep;
  onComplete: () => void;
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

export default function ActiveCase({
  sessionId,
  scenario,
  initialStep,
  onComplete,
}: ActiveCaseProps) {
  const [currentStep, setCurrentStep] = useState<CaseStep>(initialStep);
  const [currentVitals, setCurrentVitals] = useState<Vitals>(
    initialStep.currentVitals,
  );
  const [stepNumber, setStepNumber] = useState(1);
  const [selectedChoiceId, setSelectedChoiceId] = useState<bigint | null>(null);
  const [result, setResult] = useState<StepResult | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const submitAnswer = useSubmitAnswer();
  const getStep = useGetStep();

  const totalSteps = scenario.steps.length || 5;

  function handleChoiceSelect(choiceId: bigint) {
    if (selectedChoiceId !== null || submitAnswer.isPending) return;
    setSelectedChoiceId(choiceId);
    submitAnswer.mutate(
      { sessionId, choiceId },
      {
        onSuccess: (res) => {
          setResult(res);
          setCurrentVitals(res.updatedVitals);
          setScore((prev) => ({
            correct: prev.correct + (res.wasCorrect ? 1 : 0),
            total: prev.total + 1,
          }));
        },
        onError: () => {
          toast.error("Failed to submit answer.");
          setSelectedChoiceId(null);
        },
      },
    );
  }

  function handleNext() {
    if (!result) return;
    if (result.isComplete) {
      onComplete();
      return;
    }
    getStep.mutate(sessionId, {
      onSuccess: (nextStep) => {
        setCurrentStep(nextStep);
        setCurrentVitals(nextStep.currentVitals);
        setStepNumber((n) => n + 1);
        setSelectedChoiceId(null);
        setResult(null);
      },
      onError: () => {
        toast.error("Failed to load next step.");
      },
    });
  }

  const progressPct = Math.round((stepNumber / totalSteps) * 100);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Activity className="w-4 h-4 text-primary shrink-0" />
            <span className="font-display font-semibold text-sm truncate">
              {scenario.title}
            </span>
          </div>
          <div
            data-ocid="score.panel"
            className="flex items-center gap-2 shrink-0"
          >
            <span className="text-[11px] font-mono text-muted-foreground">
              SCORE
            </span>
            <span className="text-sm font-mono font-bold">
              <span className="text-emerald-400">{score.correct}</span>
              <span className="text-muted-foreground">/</span>
              <span>{score.total}</span>
            </span>
          </div>
        </div>
        <div className="w-full h-0.5 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 h-full">
          {/* Left column: narrative + choices */}
          <div className="flex flex-col gap-5">
            {/* Patient info bar */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-muted-foreground">
              <span>AGE: {String(scenario.patientInfo.age)}y</span>
              <span className="text-border">|</span>
              <span>WT: {scenario.patientInfo.weight.toFixed(0)}kg</span>
              <span className="text-border">|</span>
              <span>ASA: {String(scenario.patientInfo.asaGrade)}</span>
              <span className="text-border">|</span>
              <span className="line-clamp-1 max-w-xs">
                {scenario.patientInfo.relevantHistory}
              </span>
            </div>

            {/* Monitor on mobile */}
            <PatientMonitor
              vitals={currentVitals}
              phase={currentStep.phase}
              className="lg:hidden"
            />

            {/* Step indicator */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-muted-foreground tracking-widest">
                STEP {stepNumber} OF {totalSteps}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Narrative */}
            <motion.div
              key={String(currentStep.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              data-ocid="case.narrative"
              className="rounded-lg border border-border bg-card p-5"
            >
              <p className="text-sm leading-relaxed">{currentStep.narrative}</p>
            </motion.div>

            {/* Choices / Result */}
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div
                  key="choices"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  {currentStep.choices.map((choice, idx) => {
                    const ocidMap = [
                      "choice.item.1",
                      "choice.item.2",
                      "choice.item.3",
                      "choice.item.4",
                    ] as const;
                    const isSelected = selectedChoiceId === choice.id;
                    return (
                      <motion.button
                        key={String(choice.id)}
                        data-ocid={ocidMap[idx] ?? undefined}
                        whileHover={
                          selectedChoiceId === null ? { scale: 1.01 } : {}
                        }
                        whileTap={
                          selectedChoiceId === null ? { scale: 0.99 } : {}
                        }
                        onClick={() => handleChoiceSelect(choice.id)}
                        disabled={
                          selectedChoiceId !== null || submitAnswer.isPending
                        }
                        className={cn(
                          "text-left rounded-lg border p-4 text-sm leading-snug transition-all duration-200",
                          "hover:border-primary/60 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          "disabled:cursor-not-allowed",
                          isSelected
                            ? "border-primary/60 bg-accent"
                            : "border-border bg-card",
                        )}
                      >
                        <span className="block font-mono text-[10px] text-muted-foreground mb-1.5 tracking-wider">
                          OPTION {String.fromCharCode(65 + idx)}
                        </span>
                        {choice.text}
                      </motion.button>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  data-ocid="result.panel"
                  className={cn(
                    "rounded-lg border p-5 flex flex-col gap-4",
                    result.wasCorrect
                      ? "border-emerald-600/50 bg-emerald-950/30"
                      : "border-red-600/50 bg-red-950/30",
                  )}
                >
                  <div className="flex items-center gap-3">
                    {result.wasCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                    )}
                    <span
                      className={cn(
                        "font-display font-bold text-base",
                        result.wasCorrect ? "text-emerald-300" : "text-red-300",
                      )}
                    >
                      {result.wasCorrect ? "Correct" : "Incorrect"}
                    </span>
                  </div>

                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {result.explanation}
                  </p>

                  {result.guidelineRef && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                      <span
                        className={cn(
                          "text-[11px] font-mono font-bold px-2 py-0.5 rounded border",
                          guidelineBadgeClass(result.guidelineRef),
                        )}
                      >
                        {result.guidelineRef}
                      </span>
                    </div>
                  )}

                  <Button
                    data-ocid="next.primary_button"
                    onClick={handleNext}
                    disabled={getStep.isPending}
                    className="self-start"
                  >
                    {result.isComplete ? (
                      <>
                        View Debrief <ArrowRight className="w-4 h-4 ml-1.5" />
                      </>
                    ) : (
                      <>
                        Next Step <ArrowRight className="w-4 h-4 ml-1.5" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right column: monitor (desktop) */}
          <aside className="hidden lg:flex flex-col gap-4">
            <PatientMonitor vitals={currentVitals} phase={currentStep.phase} />

            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="text-[11px] font-mono text-muted-foreground tracking-widest mb-3">
                PATIENT SUMMARY
              </h4>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Age</span>
                  <span className="text-foreground font-mono">
                    {String(scenario.patientInfo.age)} years
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Weight</span>
                  <span className="text-foreground font-mono">
                    {scenario.patientInfo.weight.toFixed(1)} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ASA Grade</span>
                  <span className="text-foreground font-mono">
                    {String(scenario.patientInfo.asaGrade)}
                  </span>
                </div>
                <div className="pt-1 border-t border-border">
                  <p className="text-[11px] leading-relaxed">
                    {scenario.patientInfo.relevantHistory}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
