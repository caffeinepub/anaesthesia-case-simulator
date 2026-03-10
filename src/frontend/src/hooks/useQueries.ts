import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CaseStep, Debrief, Scenario, StepResult } from "../backend.d";
import { useActor } from "./useActor";

export function useInitializeScenarios() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.initializeScenarios();
    },
    mutationKey: ["initializeScenarios"],
  });
}

export function useGetScenarios() {
  const { actor, isFetching } = useActor();
  return useQuery<Scenario[]>({
    queryKey: ["scenarios"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getScenarios();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStartSession() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (scenarioId: bigint): Promise<[bigint, CaseStep]> => {
      if (!actor) throw new Error("No actor");
      return actor.startSession(scenarioId);
    },
  });
}

export function useGetStep() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (sessionId: bigint): Promise<CaseStep> => {
      if (!actor) throw new Error("No actor");
      return actor.getStep(sessionId);
    },
  });
}

export function useSubmitAnswer() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      sessionId,
      choiceId,
    }: {
      sessionId: bigint;
      choiceId: bigint;
    }): Promise<StepResult> => {
      if (!actor) throw new Error("No actor");
      return actor.submitAnswer(sessionId, choiceId);
    },
  });
}

export function useGetDebrief() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (sessionId: bigint): Promise<Debrief> => {
      if (!actor) throw new Error("No actor");
      return actor.getDebrief(sessionId);
    },
  });
}

export function useResetSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: bigint): Promise<void> => {
      if (!actor) throw new Error("No actor");
      return actor.resetSession(sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });
}
