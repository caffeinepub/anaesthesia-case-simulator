# Anaesthesia Case Simulator

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Full anaesthesia case simulator covering all phases: pre-op assessment, induction, maintenance, emergence, and recovery
- Dynamic patient vitals (HR, BP, SpO2, EtCO2, RR, Temp) that respond to user decisions
- Multiple-choice decision interface at each case step
- Scoring system tracking correct decisions, near-misses, and errors
- End-of-case debrief screen with annotated correct answers and guideline references
- Scenario library covering: general surgery, obstetrics, paediatrics, cardiac, trauma, airway emergencies (including difficult airway, can't intubate can't oxygenate)
- Case phases: Pre-op → Induction → Maintenance → Crisis/Event → Emergence → Debrief
- Guideline references: DAS (Difficult Airway Society), AAGBI, ASA, ESAIC
- Session-based flow: select scenario → run case → debrief → restart

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Backend: store scenario definitions (title, phases, steps, choices, vital changes, correct answers, guideline refs), session state (current phase, step, vital values, score, choices made)
2. Backend: APIs - getScenarios, startSession, getSessionState, submitAnswer, getDebrief, resetSession
3. Frontend: Home screen with scenario category selection
4. Frontend: Patient monitor panel showing live vitals with colour-coded alerts
5. Frontend: Case narrative + multiple-choice decision panel
6. Frontend: Score tracker (running correct/incorrect tally)
7. Frontend: End-of-case debrief with per-decision breakdown and guideline citations
