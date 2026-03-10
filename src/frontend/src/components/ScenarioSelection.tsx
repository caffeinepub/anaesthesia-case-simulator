import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Activity,
  ChevronRight,
  Loader2,
  Star,
  User,
  Weight,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { CaseStep, Scenario } from "../backend.d";
import { Category } from "../backend.d";
import { useStartSession } from "../hooks/useQueries";

interface ScenarioSelectionProps {
  scenarios: Scenario[];
  isLoading: boolean;
  onStart: (
    sessionId: bigint,
    scenario: Scenario,
    initialStep: CaseStep,
  ) => void;
}

const CATEGORY_CONFIG: Record<
  Category,
  { label: string; color: string; badge: string }
> = {
  [Category.generalSurgery]: {
    label: "General Surgery",
    color: "border-teal-600/40 bg-teal-950/30",
    badge: "bg-teal-900/60 text-teal-300 border-teal-600/40",
  },
  [Category.obstetrics]: {
    label: "Obstetrics",
    color: "border-pink-600/40 bg-pink-950/30",
    badge: "bg-pink-900/60 text-pink-300 border-pink-600/40",
  },
  [Category.paediatrics]: {
    label: "Paediatrics",
    color: "border-sky-600/40 bg-sky-950/30",
    badge: "bg-sky-900/60 text-sky-300 border-sky-600/40",
  },
  [Category.cardiac]: {
    label: "Cardiac",
    color: "border-red-600/40 bg-red-950/30",
    badge: "bg-red-900/60 text-red-300 border-red-600/40",
  },
  [Category.trauma]: {
    label: "Trauma",
    color: "border-orange-600/40 bg-orange-950/30",
    badge: "bg-orange-900/60 text-orange-300 border-orange-600/40",
  },
  [Category.airwayEmergency]: {
    label: "Airway Emergency",
    color: "border-purple-600/40 bg-purple-950/30",
    badge: "bg-purple-900/60 text-purple-300 border-purple-600/40",
  },
};

const CATEGORY_ORDER: Category[] = [
  Category.generalSurgery,
  Category.obstetrics,
  Category.paediatrics,
  Category.cardiac,
  Category.trauma,
  Category.airwayEmergency,
];

function DifficultyStars({ difficulty }: { difficulty: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-3.5 w-3.5",
            n <= difficulty
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

export default function ScenarioSelection({
  scenarios,
  isLoading,
  onStart,
}: ScenarioSelectionProps) {
  const startSession = useStartSession();
  const [startingId, setStartingId] = useState<bigint | null>(null);

  async function handleStart(scenario: Scenario) {
    setStartingId(scenario.id);
    startSession.mutate(scenario.id, {
      onSuccess: ([sessionId, initialStep]) => {
        onStart(sessionId, scenario, initialStep);
      },
      onError: () => {
        toast.error("Failed to start session. Please try again.");
        setStartingId(null);
      },
    });
  }

  const grouped = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      const items = scenarios.filter((s) => s.category === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    },
    {} as Record<Category, Scenario[]>,
  );

  let cardIndex = 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded monitor-bg border border-primary/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground leading-none">
                AnaesThesia
              </h1>
              <p className="text-[11px] text-muted-foreground tracking-wider">
                CASE SIMULATOR
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted-foreground hidden sm:block">
              DAS · AAGBI · ASA · ESAIC
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2">
            Select a Clinical Case
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl">
            Choose a scenario to begin your simulation. Manage the patient from
            pre-op through recovery. Decisions affect patient vitals in real
            time.
          </p>
        </motion.div>

        {isLoading ? (
          <div data-ocid="scenario.loading_state" className="space-y-8">
            {[1, 2].map((g) => (
              <div key={g}>
                <Skeleton className="h-5 w-40 mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : scenarios.length === 0 ? (
          <div
            data-ocid="scenario.empty_state"
            className="text-center py-20 text-muted-foreground"
          >
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No scenarios available. Please refresh.</p>
          </div>
        ) : (
          <div data-ocid="scenario.list" className="space-y-10">
            {CATEGORY_ORDER.map((cat) => {
              const items = grouped[cat];
              if (!items) return null;
              const config = CATEGORY_CONFIG[cat];
              return (
                <motion.section
                  key={cat}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className={cn(
                        "text-[11px] font-mono font-bold px-3 py-1 rounded-full border tracking-widest",
                        config.badge,
                      )}
                    >
                      {config.label.toUpperCase()}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {items.length} CASE{items.length !== 1 ? "S" : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((scenario) => {
                      const idx = ++cardIndex;
                      const ocid =
                        idx <= 3
                          ? (`scenario.item.${idx}` as const)
                          : undefined;
                      return (
                        <motion.div
                          key={String(scenario.id)}
                          whileHover={{ y: -2 }}
                          transition={{ duration: 0.15 }}
                          data-ocid={ocid}
                          className={cn(
                            "rounded-lg border p-4 flex flex-col gap-3 cursor-pointer group transition-all duration-200 hover:shadow-glow",
                            config.color,
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-display font-semibold text-sm leading-snug text-foreground group-hover:text-primary transition-colors">
                              {scenario.title}
                            </h3>
                            <DifficultyStars
                              difficulty={Number(scenario.difficulty)}
                            />
                          </div>

                          <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-3">
                            {scenario.description}
                          </p>

                          {/* Patient info */}
                          <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {String(scenario.patientInfo.age)}y
                            </span>
                            <span className="flex items-center gap-1">
                              <Weight className="w-3 h-3" />
                              {scenario.patientInfo.weight.toFixed(0)}kg
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-card border border-border">
                              ASA {String(scenario.patientInfo.asaGrade)}
                            </span>
                          </div>

                          <Button
                            data-ocid="scenario.select.button"
                            size="sm"
                            className="mt-auto w-full text-xs"
                            disabled={startingId === scenario.id}
                            onClick={() => handleStart(scenario)}
                          >
                            {startingId === scenario.id ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                Starting...
                              </>
                            ) : (
                              <>
                                Begin Case
                                <ChevronRight className="w-3 h-3 ml-1" />
                              </>
                            )}
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.section>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-16 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-muted-foreground">
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
