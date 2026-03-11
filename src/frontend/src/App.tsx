import { Toaster } from "@/components/ui/sonner";
import { useEffect, useRef, useState } from "react";
import type { CaseStep, Scenario } from "./backend.d";
import ActiveCase from "./components/ActiveCase";
import Debrief from "./components/Debrief";
import ScenarioSelection from "./components/ScenarioSelection";
import { useActor } from "./hooks/useActor";
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

  const { actor } = useActor();
  const initMutation = useInitializeScenarios();
  const scenariosQuery = useGetScenarios();

  const { mutate: initMutate } = initMutation;
  const { isLoading, refetch, data: scenarios } = scenariosQuery;

  // Only initialize once we have an actor AND the query has settled with no data
  useEffect(() => {
    if (!actor) return;
    if (isLoading) return;
    if (initCalledRef.current) return;
    if (scenarios && scenarios.length > 0) return;

    initCalledRef.current = true;
    initMutate(undefined, {
      onSuccess: () => {
        refetch();
      },
      onError: () => {
        // Allow retry next render cycle
        initCalledRef.current = false;
      },
    });
  }, [actor, isLoading, scenarios, initMutate, refetch]);

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
    refetch();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {view === "selection" && (
        <ScenarioSelection
          scenarios={scenarios ?? []}
          isLoading={isLoading || initMutation.isPending || !actor}
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
