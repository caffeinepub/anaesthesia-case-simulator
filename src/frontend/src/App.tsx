import { Toaster } from "@/components/ui/sonner";
import { useRef, useState } from "react";
import type { CaseStep, Scenario } from "./backend.d";
import ActiveCase from "./components/ActiveCase";
import Debrief from "./components/Debrief";
import ScenarioSelection from "./components/ScenarioSelection";
import { useGetScenarios, useInitializeScenarios } from "./hooks/useQueries";

type AppView = "selection" | "case" | "debrief";

interface CaseSession {
  sessionId: bigint;
  scenario: Scenario;
  initialStep: CaseStep;
}

export default function App() {
  const [view, setView] = useState<AppView>("selection");
  const [session, setSession] = useState<CaseSession | null>(null);
  const initCalledRef = useRef(false);

  const initMutation = useInitializeScenarios();
  const scenariosQuery = useGetScenarios();

  // Initialize scenarios once on mount when actor is ready
  const actorReady = !scenariosQuery.isLoading;
  if (actorReady && !initCalledRef.current) {
    initCalledRef.current = true;
    initMutation.mutate(undefined, {
      onSuccess: () => scenariosQuery.refetch(),
    });
  }

  function handleCaseStart(
    sessionId: bigint,
    scenario: Scenario,
    initialStep: CaseStep,
  ) {
    setSession({ sessionId, scenario, initialStep });
    setView("case");
  }

  function handleCaseComplete() {
    setView("debrief");
  }

  function handleReset() {
    setSession(null);
    setView("selection");
    scenariosQuery.refetch();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {view === "selection" && (
        <ScenarioSelection
          scenarios={scenariosQuery.data ?? []}
          isLoading={scenariosQuery.isLoading || initMutation.isPending}
          onStart={handleCaseStart}
        />
      )}
      {view === "case" && session && (
        <ActiveCase
          sessionId={session.sessionId}
          scenario={session.scenario}
          initialStep={session.initialStep}
          onComplete={handleCaseComplete}
        />
      )}
      {view === "debrief" && session && (
        <Debrief
          sessionId={session.sessionId}
          scenario={session.scenario}
          onReset={handleReset}
        />
      )}
      <Toaster theme="dark" position="top-right" />
    </div>
  );
}
