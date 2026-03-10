import { cn } from "@/lib/utils";
import { Phase, type Vitals } from "../backend.d";

interface PatientMonitorProps {
  vitals: Vitals;
  phase: Phase;
  className?: string;
}

function getHrClass(hr: number): string {
  if (hr < 50 || hr > 120) return "vital-amber";
  return "vital-hr";
}

function getSpo2Class(spo2: number): string {
  if (spo2 < 85) return "vital-red crisis-flash";
  if (spo2 < 90) return "vital-red";
  if (spo2 < 94) return "vital-amber";
  return "vital-spo2";
}

const PHASE_CONFIG: Record<Phase, { label: string; className: string }> = {
  [Phase.preOp]: {
    label: "PRE-OP",
    className: "bg-blue-900/50 text-blue-300 border-blue-600/50",
  },
  [Phase.induction]: {
    label: "INDUCTION",
    className: "bg-purple-900/50 text-purple-300 border-purple-600/50",
  },
  [Phase.maintenance]: {
    label: "MAINTENANCE",
    className: "bg-emerald-900/50 text-emerald-300 border-emerald-600/50",
  },
  [Phase.crisis]: {
    label: "⚠ CRISIS",
    className: "bg-red-900/60 text-red-300 border-red-500/60 crisis-flash",
  },
  [Phase.emergence]: {
    label: "EMERGENCE",
    className: "bg-amber-900/50 text-amber-300 border-amber-600/50",
  },
};

interface VitalCellProps {
  label: string;
  value: string;
  unit: string;
  valueClass: string;
}

function VitalCell({ label, value, unit, valueClass }: VitalCellProps) {
  return (
    <div className="monitor-cell rounded p-2 flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-2xl sm:text-3xl font-bold leading-none tabular-nums",
          valueClass,
        )}
      >
        {value}
      </span>
      <span className="text-[10px] font-mono text-muted-foreground">
        {unit}
      </span>
    </div>
  );
}

export default function PatientMonitor({
  vitals,
  phase,
  className,
}: PatientMonitorProps) {
  const hr = Number(vitals.hr);
  const spo2 = Number(vitals.spo2);
  const sbp = Number(vitals.sbp);
  const dbp = Number(vitals.dbp);
  const etco2 = Number(vitals.etco2);
  const rr = Number(vitals.rr);
  const temp = vitals.temp.toFixed(1);

  const phaseConfig = PHASE_CONFIG[phase] ?? PHASE_CONFIG[Phase.preOp];

  return (
    <div
      data-ocid="monitor.panel"
      className={cn(
        "monitor-bg rounded-lg p-3 scanline relative overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono text-muted-foreground tracking-widest">
            PATIENT MONITOR
          </span>
        </div>
        <span
          className={cn(
            "text-[11px] font-mono font-bold px-2 py-0.5 rounded border tracking-widest",
            phaseConfig.className,
          )}
        >
          {phaseConfig.label}
        </span>
      </div>

      {/* Vitals grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        <VitalCell
          label="HR"
          value={String(hr)}
          unit="bpm"
          valueClass={getHrClass(hr)}
        />
        <VitalCell
          label="SpO₂"
          value={String(spo2)}
          unit="%"
          valueClass={getSpo2Class(spo2)}
        />
        <VitalCell
          label="NIBP"
          value={`${sbp}/${dbp}`}
          unit="mmHg"
          valueClass="vital-bp"
        />
        <VitalCell
          label="EtCO₂"
          value={String(etco2)}
          unit="mmHg"
          valueClass="vital-etco2"
        />
        <VitalCell
          label="RR"
          value={String(rr)}
          unit="/min"
          valueClass="vital-rr"
        />
        <VitalCell
          label="TEMP"
          value={temp}
          unit="°C"
          valueClass="vital-temp"
        />
      </div>

      {/* Alerts */}
      {(spo2 < 94 || hr < 50 || hr > 120) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {spo2 < 85 && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-900/70 text-red-300 border border-red-600/50 crisis-flash">
              ⚠ CRITICAL SpO₂
            </span>
          )}
          {spo2 >= 85 && spo2 < 90 && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-900/50 text-red-300 border border-red-700/40">
              LOW SpO₂
            </span>
          )}
          {spo2 >= 90 && spo2 < 94 && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700/40">
              ↓ SpO₂
            </span>
          )}
          {hr < 50 && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700/40">
              BRADYCARDIA
            </span>
          )}
          {hr > 120 && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700/40">
              TACHYCARDIA
            </span>
          )}
        </div>
      )}
    </div>
  );
}
