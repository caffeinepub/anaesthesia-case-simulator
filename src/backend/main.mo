import Array "mo:core/Array";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Nat32 "mo:core/Nat32";
import Runtime "mo:core/Runtime";

actor {
  // Core Types
  type Category = {
    #generalSurgery;
    #obstetrics;
    #paediatrics;
    #cardiac;
    #trauma;
    #airwayEmergency;
  };

  type Phase = {
    #preOp;
    #induction;
    #maintenance;
    #crisis;
    #emergence;
  };

  type PatientInfo = {
    age : Nat;
    weight : Float;
    asaGrade : Nat;
    relevantHistory : Text;
  };

  type Vitals = {
    hr : Nat; // Heart Rate
    sbp : Nat; // Systolic Blood Pressure
    dbp : Nat; // Diastolic Blood Pressure
    spo2 : Nat; // Oxygen Saturation
    etco2 : Nat; // End-Tidal CO2
    rr : Nat; // Respiratory Rate
    temp : Float;
  };

  type Choice = {
    id : Nat;
    text : Text;
    isCorrect : Bool;
    explanation : Text;
    guidelineRef : Text;
    vitalChanges : Vitals;
  };

  type CaseStep = {
    id : Nat;
    phase : Phase;
    narrative : Text;
    choices : [Choice];
    currentVitals : Vitals;
  };

  type Scenario = {
    id : Nat;
    title : Text;
    category : Category;
    difficulty : Nat;
    description : Text;
    patientInfo : PatientInfo;
    steps : [CaseStep];
  };

  type ChoiceMade = {
    stepId : Nat;
    choiceId : Nat;
    wasCorrect : Bool;
  };

  type Score = {
    correct : Nat;
    incorrect : Nat;
    total : Nat;
  };

  type Session = {
    id : Nat;
    scenarioId : Nat;
    currentStepIndex : Nat;
    vitals : Vitals;
    score : Score;
    choicesMade : [ChoiceMade];
    isComplete : Bool;
  };

  type StepResult = {
    wasCorrect : Bool;
    explanation : Text;
    guidelineRef : Text;
    updatedVitals : Vitals;
    isComplete : Bool;
  };

  type DebriefStep = {
    stepId : Nat;
    chosenAnswer : Choice;
    correctAnswer : Choice;
    explanation : Text;
    guidelineRef : Text;
  };

  type Debrief = {
    sessionId : Nat;
    scenarioId : Nat;
    score : Score;
    steps : [DebriefStep];
  };

  // Vitals Utility
  module Vitals {
    public func getDefault() : Vitals {
      {
        hr = 80;
        sbp = 120;
        dbp = 80;
        spo2 = 99;
        etco2 = 38;
        rr = 16;
        temp = 36.7;
      };
    };
  };

  // Storage
  let scenariosMap = Map.empty<Nat, Scenario>();
  let sessionsMap = Map.empty<Nat, Session>();

  // Helpers
  func createSessionId() : Nat {
    Time.now().toNat();
  };

  // Initialize Sample Scenarios
  public shared ({ caller }) func initializeScenarios() : async () {
    let sampleScenarios : [Scenario] = [
      // Add at least 6 sample scenarios here, one per category
      {
        id = 1;
        title = "Laparoscopic Cholecystectomy";
        category = #generalSurgery;
        difficulty = 3;
        description = "Middle-aged patient undergoing elective cholecystectomy.";
        patientInfo = {
          age = 45;
          weight = 80.0;
          asaGrade = 2;
          relevantHistory = "Hypertension, no other significant history";
        };
        steps = [
          {
            id = 1;
            phase = #preOp;
            narrative = "Patient presents for elective laparoscopic cholecystectomy. Pre-op assessment?";
            choices = [
              {
                id = 1;
                text = "Check airway, fasting status, allergies, and chronic medications.";
                isCorrect = true;
                explanation = "Comprehensive pre-op assessment minimizes risk. Refer to AAGBI guidelines.";
                guidelineRef = "AAGBI Pre-op Assessment";
                vitalChanges = Vitals.getDefault();
              },
              {
                id = 2;
                text = "Skip airway assessment, focus only on surgical history.";
                isCorrect = false;
                explanation = "Manual records are essential, but overriding monitors reduces safety. Refer to ESAIC guidelines.";
                guidelineRef = "ESAIC Monitoring Standards";
                vitalChanges = Vitals.getDefault();
              },
            ];
            currentVitals = Vitals.getDefault();
          },
        ];
      },
    ];

    for (scenario in sampleScenarios.values()) {
      scenariosMap.add(scenario.id, scenario);
    };
  };

  // Public API
  public query ({ caller }) func getScenarios() : async [Scenario] {
    scenariosMap.values().toArray();
  };

  public shared ({ caller }) func startSession(scenarioId : Nat) : async (Nat, CaseStep) {
    let scenario = switch (scenariosMap.get(scenarioId)) {
      case (null) { Runtime.trap("Scenario not found") };
      case (?scenario) { scenario };
    };

    let sessionId = createSessionId();
    let session : Session = {
      id = sessionId;
      scenarioId;
      currentStepIndex = 0;
      vitals = scenario.steps[0].currentVitals;
      score = { correct = 0; incorrect = 0; total = scenario.steps.size() };
      choicesMade = [];
      isComplete = false;
    };
    sessionsMap.add(sessionId, session);
    (sessionId, scenario.steps[0]);
  };

  public query ({ caller }) func getStep(sessionId : Nat) : async CaseStep {
    let session = switch (sessionsMap.get(sessionId)) {
      case (null) { Runtime.trap("Session not found") };
      case (?session) { session };
    };
    let scenario = switch (scenariosMap.get(session.scenarioId)) {
      case (null) { Runtime.trap("Scenario not found") };
      case (?scenario) { scenario };
    };
    if (session.currentStepIndex >= scenario.steps.size()) { Runtime.trap("Invalid step") };
    scenario.steps[session.currentStepIndex];
  };

  public shared ({ caller }) func submitAnswer(sessionId : Nat, choiceId : Nat) : async StepResult {
    let session = switch (sessionsMap.get(sessionId)) {
      case (null) { Runtime.trap("Session not found") };
      case (?session) { session };
    };
    let scenario = switch (scenariosMap.get(session.scenarioId)) {
      case (null) { Runtime.trap("Scenario not found") };
      case (?scenario) { scenario };
    };

    if (session.currentStepIndex >= scenario.steps.size()) { Runtime.trap("Invalid step") };
    let currentStep = scenario.steps[session.currentStepIndex];
    let choice = switch (currentStep.choices.find(func(c) { c.id == choiceId })) {
      case (null) { Runtime.trap("Choice not found") };
      case (?choice) { choice };
    };

    let wasCorrect = choice.isCorrect;
    let newScore = {
      correct = session.score.correct + (if wasCorrect { 1 } else { 0 });
      incorrect = session.score.incorrect + (if wasCorrect { 0 } else { 1 });
      total = session.score.total;
    };

    let newChoiceMade : ChoiceMade = {
      stepId = currentStep.id;
      choiceId;
      wasCorrect;
    };
    let newChoices = [newChoiceMade].concat(session.choicesMade);

    let newSession : Session = {
      id = session.id;
      scenarioId = session.scenarioId;
      currentStepIndex = session.currentStepIndex + 1;
      vitals = choice.vitalChanges;
      score = newScore;
      choicesMade = newChoices;
      isComplete = session.currentStepIndex + 1 >= scenario.steps.size();
    };

    sessionsMap.add(sessionId, newSession);

    {
      wasCorrect;
      explanation = choice.explanation;
      guidelineRef = choice.guidelineRef;
      updatedVitals = choice.vitalChanges;
      isComplete = newSession.isComplete;
    };
  };

  public query ({ caller }) func getDebrief(sessionId : Nat) : async Debrief {
    let session = switch (sessionsMap.get(sessionId)) {
      case (null) { Runtime.trap("Session not found") };
      case (?session) { session };
    };
    let scenario = switch (scenariosMap.get(session.scenarioId)) {
      case (null) { Runtime.trap("Scenario not found") };
      case (?scenario) { scenario };
    };

    var debriefSteps : [DebriefStep] = [];

    for (chosen in session.choicesMade.values()) {
      let step = switch (scenario.steps.find(func(s) { s.id == chosen.stepId })) {
        case (null) { Runtime.trap("Step not found.") };
        case (?step) { step };
      };
      let chosenAnswer = switch (step.choices.find(func(c) { c.id == chosen.choiceId })) {
        case (null) { Runtime.trap("Choice not found.") };
        case (?choice) { choice };
      };
      let correctAnswer = switch (step.choices.find(func(c) { c.isCorrect })) {
        case (null) { Runtime.trap("Correct answer not found. ") };
        case (?choice) { choice };
      };

      debriefSteps := debriefSteps.concat([{
        stepId = step.id;
        chosenAnswer;
        correctAnswer;
        explanation = correctAnswer.explanation;
        guidelineRef = correctAnswer.guidelineRef;
      }]);
    };

    {
      sessionId = session.id;
      scenarioId = session.scenarioId;
      score = session.score;
      steps = debriefSteps;
    };
  };

  public shared ({ caller }) func resetSession(sessionId : Nat) : async () {
    switch (sessionsMap.get(sessionId)) {
      case (null) { Runtime.trap("Session not found") };
      case (?_) {
        sessionsMap.remove(sessionId);
      };
    };
  };
};
