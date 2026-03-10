import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CaseStep {
    id: bigint;
    narrative: string;
    phase: Phase;
    currentVitals: Vitals;
    choices: Array<Choice>;
}
export interface Vitals {
    hr: bigint;
    rr: bigint;
    dbp: bigint;
    sbp: bigint;
    spo2: bigint;
    temp: number;
    etco2: bigint;
}
export interface Debrief {
    scenarioId: bigint;
    score: Score;
    steps: Array<DebriefStep>;
    sessionId: bigint;
}
export interface Scenario {
    id: bigint;
    title: string;
    difficulty: bigint;
    description: string;
    steps: Array<CaseStep>;
    patientInfo: PatientInfo;
    category: Category;
}
export interface Score {
    total: bigint;
    correct: bigint;
    incorrect: bigint;
}
export interface PatientInfo {
    age: bigint;
    weight: number;
    asaGrade: bigint;
    relevantHistory: string;
}
export interface Choice {
    id: bigint;
    explanation: string;
    text: string;
    guidelineRef: string;
    isCorrect: boolean;
    vitalChanges: Vitals;
}
export interface DebriefStep {
    stepId: bigint;
    explanation: string;
    correctAnswer: Choice;
    guidelineRef: string;
    chosenAnswer: Choice;
}
export interface StepResult {
    wasCorrect: boolean;
    explanation: string;
    guidelineRef: string;
    updatedVitals: Vitals;
    isComplete: boolean;
}
export enum Category {
    obstetrics = "obstetrics",
    trauma = "trauma",
    airwayEmergency = "airwayEmergency",
    paediatrics = "paediatrics",
    cardiac = "cardiac",
    generalSurgery = "generalSurgery"
}
export enum Phase {
    emergence = "emergence",
    induction = "induction",
    crisis = "crisis",
    maintenance = "maintenance",
    preOp = "preOp"
}
export interface backendInterface {
    getDebrief(sessionId: bigint): Promise<Debrief>;
    getScenarios(): Promise<Array<Scenario>>;
    getStep(sessionId: bigint): Promise<CaseStep>;
    initializeScenarios(): Promise<void>;
    resetSession(sessionId: bigint): Promise<void>;
    startSession(scenarioId: bigint): Promise<[bigint, CaseStep]>;
    submitAnswer(sessionId: bigint, choiceId: bigint): Promise<StepResult>;
}
