"use client";
import { useState, useMemo } from "react";
import {
  calculatePressure,
  TireType,
  Surface,
  RideStyle,
  Manufacturer,
  MANUFACTURER_LABELS,
} from "./pressureUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = {
  riderWeight: number;
  bikeWeight:  number;
  tireWidth:   number;
  tireType:    TireType;
  surface:     Surface;
};

type AdvancedSettings = {
  manufacturer: Manufacturer;
  rimWidth:     number;
  rideStyle:    RideStyle;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;

const INITIAL_FORM: FormData = {
  riderWeight: 70,
  bikeWeight:  8,
  tireWidth:   28,
  tireType:    "clincher",
  surface:     "normal",
};

const INITIAL_ADVANCED: AdvancedSettings = {
  manufacturer: "other",
  rimWidth:     19,
  rideStyle:    "normal",
};

const TIRE_SIZES = [23, 25, 28, 30, 32, 35, 38, 40, 43, 47, 50];
const RIM_WIDTHS = [17, 19, 21, 23, 25];

// ─── Shared UI components ─────────────────────────────────────────────────────

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-slate-400 hover:text-sky-400 text-sm mb-5 flex items-center gap-1.5 transition-colors"
    >
      ← 前の質問に戻る
    </button>
  );
}

function NextButton({ onClick, label = "次へ →" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-4 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold rounded-2xl transition-colors text-base mt-4"
    >
      {label}
    </button>
  );
}

function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

function NumberStepper({
  value, onChange, min, max, unit,
}: {
  value: number; onChange: (v: number) => void; min: number; max: number; unit: string;
}) {
  return (
    <div className="flex items-center justify-center gap-4 my-8">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white text-3xl font-bold transition-colors flex items-center justify-center select-none"
      >
        −
      </button>
      <div className="text-center min-w-[140px]">
        <span className="text-6xl font-mono font-bold text-white tabular-nums">{value}</span>
        <span className="text-slate-400 text-xl ml-2">{unit}</span>
      </div>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white text-3xl font-bold transition-colors flex items-center justify-center select-none"
      >
        +
      </button>
    </div>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepWeight({ value, onChange, onNext }: {
  value: number; onChange: (v: number) => void; onNext: () => void;
}) {
  return (
    <>
      <StepTitle title="あなたの体重は？" subtitle="ライダーの体重を入力してください" />
      <NumberStepper value={value} onChange={onChange} min={30} max={150} unit="kg" />
      <NextButton onClick={onNext} />
    </>
  );
}

function StepBikeWeight({ value, onChange, onNext, onBack }: {
  value: number; onChange: (v: number) => void; onNext: () => void; onBack: () => void;
}) {
  return (
    <>
      <BackButton onClick={onBack} />
      <StepTitle title="バイクの重量は？" subtitle="バイク本体の重量を入力してください" />
      <NumberStepper value={value} onChange={onChange} min={4} max={25} unit="kg" />
      <NextButton onClick={onNext} />
    </>
  );
}

function StepTireWidth({ value, onChange, onNext, onBack }: {
  value: number; onChange: (v: number) => void; onNext: () => void; onBack: () => void;
}) {
  return (
    <>
      <BackButton onClick={onBack} />
      <StepTitle title="タイヤ幅は？" subtitle="使用しているタイヤの幅を選んでください" />
      <div className="my-6">
        <div className="text-center mb-5">
          <span className="text-6xl font-mono font-bold text-white tabular-nums">{value}</span>
          <span className="text-slate-400 text-xl ml-1">C</span>
        </div>
        <input
          type="range"
          min={23}
          max={50}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full accent-sky-500 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1 font-mono">
          <span>23C</span>
          <span>50C</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-5 justify-center">
          {TIRE_SIZES.map(s => (
            <button
              key={s}
              onClick={() => onChange(s)}
              className={`px-3 py-1.5 rounded-xl text-sm font-mono font-bold transition-colors ${
                value === s
                  ? "bg-sky-500 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {s}C
            </button>
          ))}
        </div>
      </div>
      <NextButton onClick={onNext} />
    </>
  );
}

function StepTireType({ value, onChange, onNext, onBack }: {
  value: TireType; onChange: (v: TireType) => void; onNext: () => void; onBack: () => void;
}) {
  const options: { value: TireType; label: string; desc: string; icon: string }[] = [
    { value: "clincher", label: "クリンチャー", desc: "チューブ入り・一般的なタイプ",  icon: "🔵" },
    { value: "tubeless", label: "チューブレス", desc: "チューブなし・低圧で走れる",    icon: "⚡" },
  ];
  return (
    <>
      <BackButton onClick={onBack} />
      <StepTitle title="タイヤのタイプは？" />
      <div className="flex flex-col gap-3 my-6">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => { onChange(opt.value); setTimeout(onNext, 180); }}
            className={`p-5 rounded-2xl border-2 text-left transition-all ${
              value === opt.value
                ? "border-sky-500 bg-sky-500/10"
                : "border-slate-700 bg-slate-800 hover:border-slate-500"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{opt.icon}</span>
              <div>
                <div className="font-bold text-white text-base">{opt.label}</div>
                <div className="text-sm text-slate-400 mt-0.5">{opt.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

function StepSurface({ value, onChange, onNext, onBack }: {
  value: Surface; onChange: (v: Surface) => void; onNext: () => void; onBack: () => void;
}) {
  const options: { value: Surface; label: string; desc: string; emoji: string }[] = [
    { value: "smooth", label: "スムーズ", desc: "新舗装・良好な路面",   emoji: "⚡" },
    { value: "normal", label: "普通",     desc: "一般的な舗装路",       emoji: "🚴" },
    { value: "rough",  label: "荒い",     desc: "古い舗装・荒れた路面", emoji: "🌊" },
    { value: "gravel", label: "グラベル", desc: "砂利道・未舗装路",     emoji: "🪨" },
  ];
  return (
    <>
      <BackButton onClick={onBack} />
      <StepTitle title="路面状況は？" subtitle="走行する路面を選んでください" />
      <div className="grid grid-cols-2 gap-3 my-6">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => { onChange(opt.value); setTimeout(onNext, 180); }}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              value === opt.value
                ? "border-sky-500 bg-sky-500/10"
                : "border-slate-700 bg-slate-800 hover:border-slate-500"
            }`}
          >
            <div className="text-2xl mb-2">{opt.emoji}</div>
            <div className="font-bold text-white text-sm">{opt.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Gauge bar ────────────────────────────────────────────────────────────────

function GaugeBar({ psi, min, max, color }: {
  psi: number; min: number; max: number; color: "sky" | "rose";
}) {
  const pct = Math.min(100, Math.max(0, ((psi - min) / (max - min)) * 100));
  const low  = pct < 25;
  const high = pct > 75;
  const barColor = low || high
    ? "bg-red-500"
    : color === "sky" ? "bg-sky-500" : "bg-rose-500";

  return (
    <div className="mt-3">
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden relative">
        <div
          className="absolute inset-0 rounded-full opacity-20"
          style={{
            background:
              "linear-gradient(to right, #ef4444 0%, #ef4444 25%, #10b981 25%, #10b981 75%, #ef4444 75%, #ef4444 100%)",
          }}
        />
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-600 mt-0.5 font-mono">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// ─── Result step ──────────────────────────────────────────────────────────────

function ResultStep({ result, advanced, showAdvanced, onToggleAdvanced, onAdvancedChange, onReset, onBack }: {
  result:             { frontPsi: number; rearPsi: number; frontBar: number; rearBar: number };
  advanced:           AdvancedSettings;
  showAdvanced:       boolean;
  onToggleAdvanced:   () => void;
  onAdvancedChange:   (a: AdvancedSettings) => void;
  onReset:            () => void;
  onBack:             () => void;
}) {
  const rideStyleOptions: { value: RideStyle; label: string }[] = [
    { value: "race",    label: "レース" },
    { value: "normal",  label: "普通" },
    { value: "comfort", label: "快適" },
  ];

  return (
    <>
      <BackButton onClick={onBack} />

      <h2 className="text-xl font-bold text-white mb-5">推奨空気圧</h2>

      {/* Pressure cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-2">FRONT</div>
          <div className="text-5xl font-mono font-bold text-sky-400 tabular-nums">{result.frontPsi}</div>
          <div className="text-sm text-slate-400 font-mono mt-0.5">{result.frontBar.toFixed(1)} bar</div>
          <GaugeBar psi={result.frontPsi} min={28} max={130} color="sky" />
        </div>
        <div className="bg-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-2">REAR</div>
          <div className="text-5xl font-mono font-bold text-rose-400 tabular-nums">{result.rearPsi}</div>
          <div className="text-sm text-slate-400 font-mono mt-0.5">{result.rearBar.toFixed(1)} bar</div>
          <GaugeBar psi={result.rearPsi} min={32} max={140} color="rose" />
        </div>
      </div>

      {/* Advanced settings */}
      <div className="mb-4">
        <button
          onClick={onToggleAdvanced}
          className="w-full flex items-center justify-between py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-300 hover:text-white transition-colors text-sm font-medium"
        >
          <span>詳細設定</span>
          <span className="text-slate-500 font-mono text-xs">{showAdvanced ? "▲ 閉じる" : "▼ 開く"}</span>
        </button>

        {showAdvanced && (
          <div className="mt-2 bg-slate-800/60 rounded-2xl p-4 space-y-5">

            {/* Manufacturer */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">メーカー</label>
              <select
                value={advanced.manufacturer}
                onChange={e => onAdvancedChange({ ...advanced, manufacturer: e.target.value as Manufacturer })}
                className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
              >
                {(Object.entries(MANUFACTURER_LABELS) as [Manufacturer, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {/* Rim width */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">
                リム内幅
              </label>
              <div className="flex gap-2">
                {RIM_WIDTHS.map(w => (
                  <button
                    key={w}
                    onClick={() => onAdvancedChange({ ...advanced, rimWidth: w })}
                    className={`flex-1 py-2 rounded-xl text-sm font-mono font-bold transition-colors ${
                      advanced.rimWidth === w
                        ? "bg-sky-500 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Ride style */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">
                ライドスタイル
              </label>
              <div className="flex gap-2">
                {rideStyleOptions.map(s => (
                  <button
                    key={s.value}
                    onClick={() => onAdvancedChange({ ...advanced, rideStyle: s.value })}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                      advanced.rideStyle === s.value
                        ? "bg-sky-500 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="w-full py-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white font-bold rounded-2xl transition-colors text-sm"
      >
        もう一度計算する
      </button>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CalculatorPage() {
  const [step,         setStep]         = useState(1);
  const [form,         setForm]         = useState<FormData>(INITIAL_FORM);
  const [advanced,     setAdvanced]     = useState<AdvancedSettings>(INITIAL_ADVANCED);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const liveResult = useMemo(() => {
    if (step !== 6) return null;
    return calculatePressure({ ...form, ...advanced });
  }, [step, form, advanced]);

  const handleBack  = () => setStep(s => Math.max(1, s - 1));
  const handleNext  = () => setStep(s => Math.min(6, s + 1));
  const handleReset = () => {
    setStep(1);
    setForm(INITIAL_FORM);
    setAdvanced(INITIAL_ADVANCED);
    setShowAdvanced(false);
  };

  const progress = ((step - 1) / TOTAL_STEPS) * 100;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease forwards; }
      `}</style>

      <div className="min-h-screen bg-slate-950 flex items-start justify-center pt-10 pb-16 px-4">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-mono font-bold text-white tracking-tight">PRESSURE CALC</h1>
            <p className="text-slate-500 text-sm mt-1">タイヤ空気圧計算ツール</p>
          </div>

          {/* Progress bar */}
          {step < 6 && (
            <div className="mb-5">
              <div className="flex justify-between text-xs text-slate-500 mb-2 font-mono">
                <span>STEP {step} / {TOTAL_STEPS}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Card — key forces remount (and fadeIn) on step change */}
          <div key={step} className="bg-slate-900 rounded-3xl p-6 shadow-2xl animate-fadeIn">
            {step === 1 && (
              <StepWeight
                value={form.riderWeight}
                onChange={v => setForm(f => ({ ...f, riderWeight: v }))}
                onNext={handleNext}
              />
            )}
            {step === 2 && (
              <StepBikeWeight
                value={form.bikeWeight}
                onChange={v => setForm(f => ({ ...f, bikeWeight: v }))}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {step === 3 && (
              <StepTireWidth
                value={form.tireWidth}
                onChange={v => setForm(f => ({ ...f, tireWidth: v }))}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {step === 4 && (
              <StepTireType
                value={form.tireType}
                onChange={v => setForm(f => ({ ...f, tireType: v }))}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {step === 5 && (
              <StepSurface
                value={form.surface}
                onChange={v => setForm(f => ({ ...f, surface: v }))}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {step === 6 && liveResult && (
              <ResultStep
                result={liveResult}
                advanced={advanced}
                showAdvanced={showAdvanced}
                onToggleAdvanced={() => setShowAdvanced(s => !s)}
                onAdvancedChange={setAdvanced}
                onReset={handleReset}
                onBack={handleBack}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
