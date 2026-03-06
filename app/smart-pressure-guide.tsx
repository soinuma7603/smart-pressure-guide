"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX, RotateCcw, Gauge, ChevronLeft } from "lucide-react";

const MANUFACTURER_CORRECTION = {
  continental:  { label: "Continental",  front:  0, rear:  0, note: "標準ケーシング・GP5000定番" },
  panaracer:    { label: "Panaracer",    front: +2, rear: +2, note: "国産・高剛性ケーシング" },
  vittoria:     { label: "Vittoria",     front: -3, rear: -3, note: "薄いケーシング・低抵抗設計" },
  schwalbe:     { label: "Schwalbe",     front: -2, rear: -2, note: "柔軟なケーシング設計" },
  michelin:     { label: "Michelin",     front:  0, rear: +1, note: "耐久性重視設計" },
  pirelli:      { label: "Pirelli",      front: -3, rear: -4, note: "スーパーソフトコンパウンド" },
  irc:          { label: "IRC",          front: +1, rear: +1, note: "国産・コスパ重視・やや柔軟" },
  bridgestone:  { label: "Bridgestone",  front: +1, rear: +2, note: "国産・耐久性重視設計" },
  other:        { label: "その他",        front:  0, rear:  0, note: "補正なし" },
};

const SURFACE_CORRECTION = {
  dry:    { label: "ドライ",   front:  0, rear:  0, emoji: "☀️" },
  wet:    { label: "ウェット", front: -7, rear: -7, emoji: "🌧️" },
  gravel: { label: "グラベル", front:-12, rear:-15, emoji: "🪨" },
  mixed:  { label: "ミックス", front: -4, rear: -4, emoji: "⛅" },
};

const STEPS = [
  {
    key: "weight",
    question: "① 体重は何キロですか？",
    speak: "体重は何キロですか？",
    type: "number",
    placeholder: "例：70",
    unit: "kg",
    hint: "数字を入力して「次へ」を押してください",
  },
  {
    key: "bikeWeight",
    question: "② バイクの重量は何kgですか？",
    speak: "バイクの重量は何キログラムですか？",
    type: "buttons_or_number",
    placeholder: "例：8.5",
    unit: "kg",
    hint: "わからない場合は「8kg」を選んでください",
    options: [
      { label: "7kg", value: 7 },
      { label: "8kg", value: 8 },
      { label: "9kg", value: 9 },
      { label: "10kg", value: 10 },
      { label: "11kg", value: 11 },
      { label: "12kg以上", value: 12 },
    ],
  },
  {
    key: "tireSize",
    question: "③ タイヤのサイズは何Cですか？",
    speak: "タイヤのサイズは何Cですか？",
    type: "buttons",
    options: [
      { label: "23C", value: 23 },
      { label: "25C", value: 25 },
      { label: "28C", value: 28 },
      { label: "30C", value: 30 },
      { label: "32C", value: 32 },
      { label: "35C", value: 35 },
      { label: "38C", value: 38 },
      { label: "40C", value: 40 },
      { label: "43C", value: 43 },
      { label: "47C", value: 47 },
      { label: "50C", value: 50 },
    ],
  },
  {
    key: "manufacturer",
    question: "④ タイヤのメーカーはどこですか？",
    speak: "タイヤのメーカーはどこですか？",
    type: "buttons",
    options: [
      { label: "Continental",  value: "continental" },
      { label: "Panaracer",    value: "panaracer" },
      { label: "Vittoria",     value: "vittoria" },
      { label: "Schwalbe",     value: "schwalbe" },
      { label: "Michelin",     value: "michelin" },
      { label: "Pirelli",      value: "pirelli" },
      { label: "IRC",          value: "irc" },
      { label: "Bridgestone",  value: "bridgestone" },
      { label: "その他",        value: "other" },
    ],
  },
  {
    key: "tireType",
    question: "⑤ タイヤのタイプはどちらですか？",
    speak: "チューブレスですか？クリンチャーですか？",
    type: "buttons",
    options: [
      { label: "🔵 クリンチャー",  value: "clincher",  desc: "一般的なチューブ入りタイプ" },
      { label: "⚡ チューブレス", value: "tubeless",  desc: "チューブなし・低圧で走れる" },
      { label: "❓ わからない",   value: "clincher",  desc: "クリンチャーとして計算します" },
    ],
  },
  {
    key: "rimWidth",
    question: "⑥ リムの内幅は何mmですか？",
    speak: "リムの内幅は何ミリですか？わからない場合はスキップを選んでください。",
    type: "buttons",
    options: [
      { label: "17mm", value: 17 },
      { label: "19mm", value: 19 },
      { label: "21mm", value: 21 },
      { label: "23mm", value: 23 },
      { label: "25mm", value: 25 },
      { label: "スキップ（19mm）", value: 19 },
    ],
  },
  {
    key: "surface",
    question: "⑦ 路面状況はどうですか？",
    speak: "路面状況はどうですか？",
    type: "buttons",
    options: [
      { label: "☀️ ドライ",    value: "dry",    desc: "晴れた舗装路" },
      { label: "🌧️ ウェット",  value: "wet",    desc: "雨・濡れた路面" },
      { label: "🪨 グラベル",  value: "gravel", desc: "砂利道・未舗装路" },
      { label: "⛅ ミックス",  value: "mixed",  desc: "舗装+未舗装の混合" },
    ],
  },
];

function calculatePressure({ weightKg, bikeWeightKg = 8, tireSizeC, manufacturer = "other", tireType = "clincher", rimInternalWidth = 19, surface = "dry" }: {
  weightKg: number;
  bikeWeightKg?: number;
  tireSizeC: number;
  manufacturer?: string;
  tireType?: string;
  rimInternalWidth?: number;
  surface?: string;
}) {
  // 総重量（ライダー＋バイク）で計算（SRAM AXS方式）
  const totalWeight = weightKg + bikeWeightKg;
  const rearLoadKg  = totalWeight * 0.509;
  const frontLoadKg = totalWeight * 0.491;
  const K = 458;
  const rimCorrection = (rimInternalWidth - 17) * 0.4;
  const effectiveTireWidth = tireSizeC + rimCorrection;
  let rearPsi  = K * rearLoadKg  / Math.pow(effectiveTireWidth, 1.6);
  let frontPsi = K * frontLoadKg / Math.pow(effectiveTireWidth, 1.6);
  if (tireType === "tubeless") { frontPsi -= 6; rearPsi -= 6; }
  const mfr  = MANUFACTURER_CORRECTION[manufacturer] || MANUFACTURER_CORRECTION.other;
  frontPsi += mfr.front; rearPsi += mfr.rear;
  const surf = SURFACE_CORRECTION[surface] || SURFACE_CORRECTION.dry;
  frontPsi += surf.front; rearPsi += surf.rear;
  frontPsi = Math.max(28, Math.min(130, Math.round(frontPsi)));
  rearPsi  = Math.max(32, Math.min(140, Math.round(rearPsi)));
  return {
    frontPsi, rearPsi,
    frontBar: (frontPsi / 14.504).toFixed(1),
    rearBar:  (rearPsi  / 14.504).toFixed(1),
    mfrNote: mfr.note,
    surfaceEmoji: surf.emoji,
  };
}

function PressureGauge({ psi, label, color }) {
  const min = 28, max = 130;
  const pct = Math.min(100, Math.max(0, ((psi - min) / (max - min)) * 100));
  const angle = -135 + (pct / 100) * 270;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
      <svg viewBox="0 0 100 100" width="96" height="96">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1a2e" strokeWidth="8"/>
        <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${pct*2.64} 264`} strokeDashoffset="66" strokeLinecap="round"
          transform="rotate(-225 50 50)" style={{ filter:`drop-shadow(0 0 6px ${color})` }}/>
        <line x1="50" y1="50"
          x2={50+28*Math.cos((angle-90)*Math.PI/180)}
          y2={50+28*Math.sin((angle-90)*Math.PI/180)}
          stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="50" cy="50" r="4" fill={color}/>
      </svg>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:22, fontWeight:800, color, fontFamily:"monospace" }}>{psi}</div>
        <div style={{ fontSize:10, color:"#666", letterSpacing:"0.12em", textTransform:"uppercase" }}>psi · {label}</div>
      </div>
    </div>
  );
}

function OptionButtons({ options, onSelect }) {
  const [selected, setSelected] = useState(null);
  const handleClick = (opt) => {
    if (selected !== null) return;
    setSelected(opt.value + opt.label);
    setTimeout(() => onSelect(opt), 200);
  };
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:10 }}>
      {options.map((opt) => {
        const isSelected = selected === opt.value + opt.label;
        return (
          <button key={opt.value + opt.label} onClick={() => handleClick(opt)}
            style={{ padding:opt.desc?"10px 14px":"8px 16px", borderRadius:12, background:isSelected?"linear-gradient(135deg,#38bdf8,#818cf8)":"#1c2128", border:`1px solid ${isSelected?"#38bdf8":"#30363d"}`, color:isSelected?"#fff":"#c9d1d9", cursor:selected!==null?"default":"pointer", fontSize:13, fontFamily:"'Noto Sans JP',sans-serif", transition:"all 0.15s", textAlign:"left", opacity:selected!==null&&!isSelected?0.4:1 }}>
            <div style={{ fontWeight:600 }}>{opt.label}</div>
            {opt.desc && <div style={{ fontSize:10, color:isSelected?"rgba(255,255,255,0.7)":"#484f58", marginTop:2 }}>{opt.desc}</div>}
          </button>
        );
      })}
    </div>
  );
}

export default function SmartPressureGuide() {
  const [currentStep, setCurrentStep]         = useState(0);
  const [collectedParams, setCollectedParams] = useState({});
  const [messages, setMessages]               = useState([]);
  const [numberInput, setNumberInput]         = useState("");
  const [voiceEnabled, setVoiceEnabled]       = useState(true);
  const [isListening, setIsListening]         = useState(false);
  const [isSpeaking, setIsSpeaking]           = useState(false);
  const [finished, setFinished]               = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const speak = useCallback((text) => {
    if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang="ja-JP"; u.rate=0.95; u.pitch=1.05;
    u.onstart=()=>setIsSpeaking(true); u.onend=()=>setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [voiceEnabled]);

  useEffect(() => {
    const step = STEPS[0];
    setMessages([{ id:Date.now(), role:"assistant", text:`こんにちは！🚲 スマート・プレッシャー・ガイドへようこそ。\n\n最適な空気圧を計算するために、**7つの質問**にお答えください。\n\n${step.question}\n\n💡 ${step.hint??""}`, stepType:step.type, options:step.options??[], isLast:true }]);
    setTimeout(()=>speak(step.speak), 500);
  }, [speak]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const handleAnswer = useCallback((value, display) => {
    const step = STEPS[currentStep];
    const newParams = { ...collectedParams, [step.key]: value };
    setCollectedParams(newParams);
    setMessages(prev => prev.map(m=>({...m, isLast:false})));
    setMessages(prev => [...prev, { id:Date.now(), role:"user", text:display }]);
    const nextStep = currentStep + 1;
    if (nextStep < STEPS.length) {
      setCurrentStep(nextStep);
      const next = STEPS[nextStep];
      setTimeout(() => {
        setMessages(prev => [...prev, { id:Date.now(), role:"assistant", text:`✅ **${display}** を記録しました！\n\n${next.question}${next.hint?"\n\n💡 "+next.hint:""}`, stepType:next.type, options:next.options??[], isLast:true }]);
        speak(next.speak);
      }, 300);
    } else {
      setTimeout(() => {
        const fp = {
          weightKg:         newParams.weight      ?? 70,
          bikeWeightKg:     newParams.bikeWeight  ?? 8,
          tireSizeC:        newParams.tireSize     ?? 25,
          manufacturer:     newParams.manufacturer ?? "other",
          tireType:         newParams.tireType     ?? "clincher",
          rimInternalWidth: newParams.rimWidth     ?? 19,
          surface:          newParams.surface      ?? "dry",
        };
        const result = calculatePressure(fp);
        const surf = SURFACE_CORRECTION[fp.surface] || SURFACE_CORRECTION.dry;
        const mfr  = MANUFACTURER_CORRECTION[fp.manufacturer] || MANUFACTURER_CORRECTION.other;
        setFinished(true);
        setMessages(prev => [...prev, {
          id:Date.now(), role:"assistant",
          text:
            `${surf.emoji} **推奨空気圧（Frank Berto式）**\n\n` +
            `🔵 フロント: **${result.frontPsi} psi** (${result.frontBar} bar)\n` +
            `🔴 リア:　　 **${result.rearPsi} psi** (${result.rearBar} bar)\n\n` +
            `**計算条件**\n` +
            `• ライダー体重: ${fp.weightKg} kg\n` +
            `• バイク重量: ${fp.bikeWeightKg} kg\n` +
            `• 総重量: ${fp.weightKg + fp.bikeWeightKg} kg\n` +
            `• タイヤ: ${fp.tireSizeC}C / ${mfr.label}\n` +
            `• タイプ: ${fp.tireType==="tubeless"?"チューブレス":"クリンチャー"}\n` +
            `• リム内幅: ${fp.rimInternalWidth}mm\n` +
            `• 路面: ${surf.label}\n\n` +
            `💡 実走後に微調整をおすすめします。`,
          result, params:fp,
        }]);
        speak(`計算完了！フロント${result.frontPsi}ポンド、${result.frontBar}バール。リア${result.rearPsi}ポンド、${result.rearBar}バールです。`);
      }, 300);
    }
  }, [currentStep, collectedParams, speak]);

  const handleNumberSubmit = () => {
    const num = parseFloat(numberInput);
    if (isNaN(num) || num <= 0) return;
    const step = STEPS[currentStep];
    setNumberInput("");
    handleAnswer(num, `${num} ${step.unit??""}`);
  };

  const toggleListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("このブラウザは音声認識に対応していません。"); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const rec = new SR();
    rec.lang="ja-JP"; rec.continuous=false; rec.interimResults=false;
    rec.onresult=(e)=>{ setNumberInput(e.results[0][0].transcript.replace(/[^0-9.]/g,"")); setIsListening(false); };
    rec.onerror=()=>setIsListening(false); rec.onend=()=>setIsListening(false);
    recognitionRef.current=rec; rec.start(); setIsListening(true);
  }, [isListening]);

  const handleBack = useCallback(() => {
    if (finished) {
      const lastStep = STEPS.length - 1;
      setFinished(false);
      setMessages(prev => {
        const newMessages = prev.slice(0, -2);
        return newMessages.map((m, i) =>
          i === newMessages.length - 1 ? { ...m, isLast: true, id: Date.now() } : m
        );
      });
      setCollectedParams(prev => {
        const newParams = { ...prev };
        delete newParams[STEPS[lastStep].key];
        return newParams;
      });
      setCurrentStep(lastStep);
      setNumberInput("");
    } else if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setMessages(prev => {
        const newMessages = prev.slice(0, -2);
        return newMessages.map((m, i) =>
          i === newMessages.length - 1 ? { ...m, isLast: true, id: Date.now() } : m
        );
      });
      setCollectedParams(prev => {
        const newParams = { ...prev };
        delete newParams[STEPS[prevStep].key];
        return newParams;
      });
      setCurrentStep(prevStep);
      setNumberInput("");
    }
  }, [currentStep, finished]);

  const handleReset = () => {
    setCurrentStep(0); setCollectedParams({}); setNumberInput(""); setFinished(false);
    window.speechSynthesis?.cancel();
    const step = STEPS[0];
    setMessages([{ id:Date.now(), role:"assistant", text:`リセットしました！🚲\n\n${step.question}\n\n💡 ${step.hint??""}`, stepType:step.type, options:step.options??[], isLast:true }]);
    speak(step.speak);
  };

  const renderText = (text) => text.split("\n").map((line,i)=>(
    <div key={i} style={{ marginBottom:line===""?6:2 }}>
      {line.split(/\*\*(.*?)\*\*/g).map((p,j)=>j%2===1?<span key={j} style={{fontWeight:700,color:"#e6edf3"}}>{p}</span>:<span key={j}>{p}</span>)}
    </div>
  ));

  const currentStepData = STEPS[currentStep];
  const isNumberStep = currentStepData?.type === "number";
  const isButtonsOrNumber = currentStepData?.type === "buttons_or_number";
  const progress = Math.round((currentStep / STEPS.length) * 100);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#0a0e14}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.95)}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#30363d;border-radius:2px}
      `}</style>

      <div style={{minHeight:"100vh",background:"#0a0e14",fontFamily:"'Noto Sans JP',sans-serif",display:"flex",flexDirection:"column",maxWidth:680,margin:"0 auto"}}>

        {/* ヘッダー */}
        <div style={{padding:"20px 20px 12px",borderBottom:"1px solid #1c2128",background:"linear-gradient(180deg,#0d1117 0%,transparent 100%)",position:"sticky",top:0,zIndex:10,backdropFilter:"blur(12px)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,background:"linear-gradient(135deg,#38bdf8 0%,#818cf8 100%)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 20px rgba(56,189,248,0.3)"}}>
                <Gauge size={20} color="#fff"/>
              </div>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:"#e6edf3",letterSpacing:"-0.01em",fontFamily:"monospace"}}>SMART PRESSURE</div>
                <div style={{fontSize:10,color:"#484f58",letterSpacing:"0.15em",textTransform:"uppercase"}}>Tire Pressure Guide · Frank Berto式</div>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              {(currentStep > 0 || finished) && (
                <button onClick={handleBack}
                  title="前の質問に戻る"
                  style={{width:36,height:36,borderRadius:10,background:"#1c2128",border:"1px solid #30363d",color:"#c9d1d9",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <ChevronLeft size={15}/>
                </button>
              )}
              <button onClick={()=>{setVoiceEnabled(v=>!v);window.speechSynthesis?.cancel();}}
                style={{width:36,height:36,borderRadius:10,background:voiceEnabled?"rgba(56,189,248,0.15)":"#1c2128",border:`1px solid ${voiceEnabled?"#38bdf8":"#30363d"}`,color:voiceEnabled?"#38bdf8":"#484f58",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {voiceEnabled?<Volume2 size={15}/>:<VolumeX size={15}/>}
              </button>
              <button onClick={handleReset} style={{width:36,height:36,borderRadius:10,background:"#1c2128",border:"1px solid #30363d",color:"#484f58",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <RotateCcw size={15}/>
              </button>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{flex:1,height:4,background:"#1c2128",borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#38bdf8,#818cf8)",borderRadius:2,transition:"width 0.4s ease"}}/>
            </div>
            <div style={{fontSize:10,color:"#484f58",fontFamily:"monospace",minWidth:32}}>{currentStep}/{STEPS.length}</div>
          </div>
        </div>

        {/* メッセージ */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 16px",display:"flex",flexDirection:"column"}}>
          {messages.map((msg)=>(
            <div key={msg.id} style={{animation:"fadeSlide 0.3s ease forwards"}}>
              {msg.role==="assistant"&&(
                <div style={{display:"flex",justifyContent:"flex-start",marginBottom:8}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#38bdf8,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",marginRight:10,flexShrink:0,marginTop:4,fontSize:14}}>🚲</div>
                  <div style={{maxWidth:"88%"}}>
                    <div style={{padding:"12px 16px",borderRadius:"18px 18px 18px 4px",background:"linear-gradient(135deg,#1c2128,#21262d)",border:"1px solid #30363d",color:"#c9d1d9",fontSize:14,lineHeight:1.6}}>
                      {renderText(msg.text)}
                    </div>
                    {msg.result&&msg.params&&(
                      <div style={{background:"linear-gradient(135deg,#0d1117 0%,#161b22 100%)",border:"1px solid #30363d",borderRadius:16,padding:"20px 24px",marginTop:8}}>
                        <div style={{display:"flex",justifyContent:"center",gap:40,marginBottom:20}}>
                          <PressureGauge psi={msg.result.frontPsi} label="FRONT" color="#38bdf8"/>
                          <PressureGauge psi={msg.result.rearPsi}  label="REAR"  color="#f43f5e"/>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:11}}>
                          {[
                            ["体重",`${msg.params.weightKg} kg`],
                            ["バイク重量",`${msg.params.bikeWeightKg} kg`],
                            ["タイヤ",`${msg.params.tireSizeC}C`],
                            ["タイプ",msg.params.tireType==="tubeless"?"チューブレス":"クリンチャー"],
                            ["リム内幅",`${msg.params.rimInternalWidth}mm`],
                            ["メーカー",MANUFACTURER_CORRECTION[msg.params.manufacturer]?.label??"その他"],
                            ["路面",`${SURFACE_CORRECTION[msg.params.surface]?.emoji} ${SURFACE_CORRECTION[msg.params.surface]?.label}`],
                            ["総重量",`${msg.params.weightKg+msg.params.bikeWeightKg} kg`],
                          ].map(([k,v])=>(
                            <div key={k} style={{background:"#0d1117",borderRadius:8,padding:"6px 10px",display:"flex",justifyContent:"space-between"}}>
                              <span style={{color:"#484f58"}}>{k}</span>
                              <span style={{color:"#e6edf3",fontWeight:600}}>{v}</span>
                            </div>
                          ))}
                        </div>
                        <button onClick={handleReset} style={{marginTop:16,width:"100%",padding:"12px",borderRadius:12,background:"linear-gradient(135deg,#38bdf8,#818cf8)",border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif"}}>
                          🔄 もう一度計算する
                        </button>
                      </div>
                    )}
                    {!finished&&msg.isLast&&(msg.stepType==="buttons"||msg.stepType==="buttons_or_number")&&(
                      <OptionButtons options={msg.options} onSelect={(opt)=>handleAnswer(opt.value, opt.label)}/>
                    )}
                  </div>
                </div>
              )}
              {msg.role==="user"&&(
                <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
                  <div style={{maxWidth:"75%",padding:"12px 16px",borderRadius:"18px 18px 4px 18px",background:"linear-gradient(135deg,#38bdf8,#818cf8)",color:"#fff",fontSize:14,lineHeight:1.6,fontWeight:500}}>
                    {msg.text}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef}/>
        </div>

        {/* 数字入力エリア */}
        {!finished&&(isNumberStep||isButtonsOrNumber)&&(
          <div style={{padding:"12px 16px 8px",borderTop:"1px solid #1c2128",background:"#0d1117"}}>
            {isButtonsOrNumber&&<div style={{fontSize:11,color:"#484f58",marginBottom:8,textAlign:"center"}}>または数字で直接入力</div>}
            <div style={{display:"flex",gap:8,alignItems:"center",background:"#1c2128",border:`1px solid ${isListening?"#f43f5e":"#30363d"}`,borderRadius:16,padding:"8px 8px 8px 14px",boxShadow:isListening?"0 0 0 3px rgba(244,63,94,0.15)":"none"}}>
              <input type="number" value={numberInput} onChange={e=>setNumberInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")handleNumberSubmit();}}
                placeholder={currentStepData?.placeholder??"数字を入力"}
                style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#e6edf3",fontSize:20,fontFamily:"monospace",fontWeight:700}}/>
              <span style={{color:"#484f58",fontSize:14,marginRight:4}}>{currentStepData?.unit}</span>
              <button onClick={toggleListening}
                style={{width:38,height:38,borderRadius:12,background:isListening?"linear-gradient(135deg,#f43f5e,#ec4899)":"#161b22",border:"none",color:isListening?"#fff":"#484f58",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",animation:isListening?"pulse 1s infinite":"none"}}>
                {isListening?<MicOff size={16}/>:<Mic size={16}/>}
              </button>
              <button onClick={handleNumberSubmit} disabled={!numberInput}
                style={{padding:"0 20px",height:38,borderRadius:12,background:numberInput?"linear-gradient(135deg,#38bdf8,#818cf8)":"#161b22",border:"none",color:numberInput?"#fff":"#484f58",cursor:numberInput?"pointer":"default",fontSize:14,fontWeight:700,fontFamily:"'Noto Sans JP',sans-serif"}}>
                次へ
              </button>
            </div>
            {isSpeaking&&<div style={{textAlign:"center",fontSize:10,color:"#38bdf8",marginTop:8}}>🔊 読み上げ中...</div>}
          </div>
        )}

        <div style={{padding:"8px 16px 16px",textAlign:"center",fontSize:10,color:"#30363d",letterSpacing:"0.08em"}}>
          Frank Berto式 · SRAM AXS方式（総重量計算） · チューブレス対応
        </div>
      </div>
    </>
  );
}