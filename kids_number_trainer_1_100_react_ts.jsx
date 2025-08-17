// File: src/NumberTrainerApp.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Shuffle, StepBack, StepForward, Play, RotateCcw, Check, X, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";

/**
 * เด็ก 5 ขวบ ฝึกจำตัวเลข 1–100 พร้อมคำศัพท์อังกฤษ
 * โหมด "เรียน" = แฟลชการ์ด, โหมด "ทดสอบ" = ควิซ 100 ข้อ
 * ใช้ Web Speech API เพื่อออกเสียงคำศัพท์ (อังกฤษ ➜ ไทย)
 */

// -------------------- Data --------------------
export type NumberWord = { value: number; word: string };

// English words 1..19
const EN_ONES = [
  "zero","one","two","three","four","five","six","seven","eight","nine",
  "ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"
] as const;
// Tens 20..90
const EN_TENS = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"] as const;

function englishWord(n: number): string {
  if (n < 20) return EN_ONES[n];
  if (n === 100) return "one hundred";
  const t = Math.floor(n / 10);
  const u = n % 10;
  return EN_TENS[t] + (u ? " " + EN_ONES[u] : "");
}

// Thai digits for units
const TH_UNITS = ["ศูนย์","หนึ่ง","สอง","สาม","สี่","ห้า","หก","เจ็ด","แปด","เก้า"] as const;
function thaiWord(n: number): string {
  if (n === 100) return "หนึ่งร้อย";
  if (n < 10) return TH_UNITS[n];
  if (n === 10) return "สิบ";
  if (n < 20) {
    const u = n % 10;
    return "สิบ" + (u === 1 ? "เอ็ด" : TH_UNITS[u]);
  }
  const t = Math.floor(n / 10);
  const u = n % 10;
  const tens = t === 2 ? "ยี่สิบ" : (t === 1 ? "สิบ" : TH_UNITS[t] + "สิบ");
  const units = u === 0 ? "" : (u === 1 ? "เอ็ด" : TH_UNITS[u]);
  return tens + units;
}

const NUMBERS: NumberWord[] = Array.from({ length: 100 }, (_, i) => {
  const value = i + 1;
  return { value, word: englishWord(value) };
});

// สี & อีโมจิสนุก ๆ สำหรับเด็ก
const KID_PALETTE = [
  { gradient: "from-pink-300 via-orange-200 to-yellow-300", ring: "ring-pink-200", cardBg: "bg-white/80 backdrop-blur" },
  { gradient: "from-sky-300 via-cyan-200 to-teal-300", ring: "ring-sky-200", cardBg: "bg-white/80 backdrop-blur" },
  { gradient: "from-violet-300 via-purple-200 to-fuchsia-300", ring: "ring-violet-200", cardBg: "bg-white/80 backdrop-blur" },
  { gradient: "from-emerald-300 via-lime-200 to-yellow-300", ring: "ring-emerald-200", cardBg: "bg-white/80 backdrop-blur" },
  { gradient: "from-rose-300 via-pink-200 to-fuchsia-300", ring: "ring-rose-200", cardBg: "bg-white/80 backdrop-blur" },
  { gradient: "from-amber-300 via-orange-200 to-red-300", ring: "ring-amber-200", cardBg: "bg-white/80 backdrop-blur" },
  { gradient: "from-indigo-300 via-blue-200 to-sky-300", ring: "ring-indigo-200", cardBg: "bg-white/80 backdrop-blur" },
];

// -------------------- Utils --------------------
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sampleDistinct<T>(pool: T[], count: number, exclude: (x: T) => boolean): T[] {
  const filtered = pool.filter((x) => !exclude(x));
  const picked: T[] = [];
  while (picked.length < count && filtered.length > 0) {
    const idx = Math.floor(Math.random() * filtered.length);
    picked.push(filtered.splice(idx, 1)[0]);
  }
  return picked;
}

// -------------------- Speech --------------------
function pickVoice(prefix: string) {
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  return voices.find((v) => v.lang?.toLowerCase().startsWith(prefix));
}

function speakEnglish(text: string, rate = 0.9) {
  // why: feedback ภาษาอังกฤษสั้น ๆ
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const utter = new SpeechSynthesisUtterance(text);
    const enVoice = pickVoice("en");
    if (enVoice) utter.voice = enVoice;
    utter.lang = "en-US";
    utter.rate = rate;
    synth.cancel();
    synth.speak(utter);
  } catch {}
}

function speakEnThenTh(enText: string, thText: string, rateEn = 0.9, rateTh = 0.9) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const enUtter = new SpeechSynthesisUtterance(enText);
    const thUtter = new SpeechSynthesisUtterance(thText);
    const enV = pickVoice("en");
    const thV = pickVoice("th");
    if (enV) enUtter.voice = enV; enUtter.lang = "en-US"; enUtter.rate = rateEn;
    if (thV) thUtter.voice = thV; thUtter.lang = "th-TH"; thUtter.rate = rateTh;
    synth.speak(enUtter);
    synth.speak(thUtter);
  } catch {}
}

// ---- Anti-double-speak guard ----
const __speakGuard = { lastKey: "", lastAt: 0 };
function speakOnceEnTh(key: string, enText: string, thText: string) {
  const now = Date.now();
  if (__speakGuard.lastKey === key && now - __speakGuard.lastAt < 350) return; // กัน StrictMode effect ซ้ำ
  __speakGuard.lastKey = key;
  __speakGuard.lastAt = now;
  speakEnThenTh(enText, thText);
}

// -------------------- Storage --------------------
const STORE_KEY = {
  mode: "kids-number-trainer:mode",
  learnIndex: "kids-number-trainer:learnIndex",
  quizIndex: "kids-number-trainer:quizIndex",
  quizOrder: "kids-number-trainer:quizOrder",
  score: "kids-number-trainer:score",
} as const;

// -------------------- Timing --------------------
// why: เวลาหน่วงหลังตอบ เพื่อให้เด็กเห็นไฮไลต์ก่อนขยับไปข้อถัดไป
const DELAY = { CORRECT_MS: 3000, WRONG_MS: 5000 } as const;

// -------------------- Dev Self-Tests (lightweight, non-breaking) --------------------
function runDevSelfTests() {
  try {
    console.groupCollapsed("[KNT] self-tests");
    console.assert(NUMBERS.length === 100, "NUMBERS should have 100 items");
    const values = NUMBERS.map((n) => n.value);
    const uniq = new Set(values);
    console.assert(uniq.size === 100, "values should be unique 1..100");
    // English
    console.assert(englishWord(21) === "twenty one", "EN 21 should be 'twenty one'");
    console.assert(englishWord(40) === "forty", "EN 40 should be 'forty'");
    console.assert(englishWord(100) === "one hundred", "EN 100 should be 'one hundred'");
    // Thai
    console.assert(thaiWord(11) === "สิบเอ็ด", "TH 11 should be 'สิบเอ็ด'");
    console.assert(thaiWord(21) === "ยี่สิบเอ็ด", "TH 21 should be 'ยี่สิบเอ็ด'");
    console.assert(thaiWord(40) === "สี่สิบ", "TH 40 should be 'สี่สิบ'");
    console.assert(thaiWord(100) === "หนึ่งร้อย", "TH 100 should be 'หนึ่งร้อย'");

    // Utils
    const arr = [1, 2, 3];
    const shuffled = shuffleArray(arr);
    console.assert(arr.join(",") === "1,2,3", "shuffleArray must not mutate input");
    console.assert(shuffled.length === 3, "shuffleArray length holds");

    const sampled = sampleDistinct(NUMBERS, 2, (x) => x.value === 5);
    console.assert(sampled.every((x) => x.value !== 5), "sampleDistinct respects exclude");
    console.assert(sampleDistinct(NUMBERS, 0, () => false).length === 0, "sampleDistinct count 0 returns empty");

    // English/Thai edge mappings
    console.assert(englishWord(99) === "ninety nine", "EN 99 should be 'ninety nine'");
    console.assert(thaiWord(99) === "เก้าสิบเก้า", "TH 99 should be 'เก้าสิบเก้า'");

    // Delay expectations
    console.assert(DELAY.CORRECT_MS === 1000, "Correct delay should be 1000ms");

    console.groupEnd();
  } catch (e) {
    console.warn("[KNT] self-tests failed:", e);
  }
}
let __knt_tests_ran = false;
if (typeof window !== "undefined" && !__knt_tests_ran) {
  runDevSelfTests();
  __knt_tests_ran = true;
}

// -------------------- Components --------------------
function Header({ mode, onToggleMode }: { mode: "learn" | "quiz"; onToggleMode: (m: "learn" | "quiz") => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-3">
        <GraduationCap className="w-7 h-7" aria-hidden />
        <div className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 flex items-center gap-2">
          เลข 1–100 + English <Sparkles className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm md:text-base">เรียน</span>
        <Switch
          aria-label="สลับโหมด"
          checked={mode === "quiz"}
          onCheckedChange={(checked) => onToggleMode(checked ? "quiz" : "learn")}
        />
        <span className="text-sm md:text-base">ทดสอบ</span>
      </div>
    </div>
  );
}

function Flashcard({ index, onIndex, onShuffle }: { index: number; onIndex: (i: number) => void; onShuffle: () => void }) {
  const item = NUMBERS[index];
  const [flip, setFlip] = useState(false);
  const palette = KID_PALETTE[(item.value - 1) % KID_PALETTE.length];

  const speakNow = useCallback(() => {
    const th = thaiWord(item.value);
    speakEnThenTh(`${item.word}`, `${th}`);
  }, [item]);

  useEffect(() => setFlip(false), [index]);

  // อ่านอัตโนมัติ: อังกฤษ ➜ ไทย (กันซ้ำใน StrictMode)
  useEffect(() => {
    const th = thaiWord(item.value);
    speakOnceEnTh(`flash-${index}`, `${item.word}`, `${th}`);
  }, [index, item.word, item.value]);

  return (
    <div className={`w-full max-w-xl mx-auto select-none p-1 rounded-3xl bg-gradient-to-br ${palette.gradient}`}>
      <Card className={`rounded-2xl ${palette.cardBg} ring-4 ${palette.ring}`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg">แฟลชการ์ด</div>
          <div className="flex gap-2">
            <Button variant="secondary" size="icon" onClick={onShuffle} aria-label="สับไพ่">
              <Shuffle />
            </Button>
            <Button variant="secondary" size="icon" onClick={speakNow} aria-label="ออกเสียง">
              <Volume2 />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={index + (flip ? "-b" : "-a")}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="rounded-2xl p-6 md:p-10 text-center cursor-pointer"
                onClick={() => setFlip((f) => !f)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setFlip((f) => !f);
                  }
                }}
              >
                {!flip ? (
                  <>
                    <div className="text-7xl md:text-8xl font-extrabold tracking-tight drop-shadow-sm">{item.value}</div>
                    <div className="mt-3 text-3xl md:text-4xl font-semibold lowercase">{item.word}</div>
                    <div className="mt-1 text-sm opacity-60">แตะเพื่อพลิก</div>
                  </>
                ) : (
                  <>
                    <div className="text-5xl md:text-6xl font-extrabold lowercase tracking-wide">{item.word}</div>
                    <div className="mt-3 text-3xl font-extrabold">{item.value}</div>
                    <div className="mt-1 text-sm opacity-60">แตะอีกครั้งเพื่อกลับ</div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => onIndex((index - 1 + NUMBERS.length) % NUMBERS.length)}
            className="text-base"
          >
            <StepBack className="mr-2" /> ก่อนหน้า
          </Button>
          <div className="text-sm opacity-70">{index + 1} / {NUMBERS.length}</div>
          <Button variant="ghost" onClick={() => onIndex((index + 1) % NUMBERS.length)} className="text-base">
            ถัดไป <StepForward className="ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function Quiz() {
  const [order, setOrder] = useState<number[]>(() => {
    const fromStore = localStorage.getItem(STORE_KEY.quizOrder);
    return fromStore ? JSON.parse(fromStore) : shuffleArray(NUMBERS.map((_, i) => i));
  });
  const [idx, setIdx] = useState<number>(() => Number(localStorage.getItem(STORE_KEY.quizIndex) ?? 0));
  const [score, setScore] = useState<number>(() => Number(localStorage.getItem(STORE_KEY.score) ?? 0));
  const [answered, setAnswered] = useState<null | boolean>(null);

  const safeIdx = Math.min(idx, order.length - 1);
  const current = NUMBERS[order[safeIdx]];
  const palette = KID_PALETTE[(current.value - 1) % KID_PALETTE.length];

  useEffect(() => localStorage.setItem(STORE_KEY.quizOrder, JSON.stringify(order)), [order]);
  useEffect(() => localStorage.setItem(STORE_KEY.quizIndex, String(idx)), [idx]);
  useEffect(() => localStorage.setItem(STORE_KEY.score, String(score)), [score]);

  const options = useMemo(() => {
    const wrongs = sampleDistinct(NUMBERS, 2, (x) => x.value === current.value);
    return shuffleArray([current, ...wrongs]);
  }, [current]);

  // อ่านอัตโนมัติ: อังกฤษ ➜ ไทย (กันซ้ำใน StrictMode)
  useEffect(() => {
    if (idx < order.length) {
      const th = thaiWord(current.value);
      speakOnceEnTh(`quiz-${order[safeIdx]}`, `${current.word}`, `${th}`);
    }
  }, [safeIdx, idx, order.length, current.word, current.value, order]);

  const speakPrompt = useCallback(() => {
    const th = thaiWord(current.value);
    speakEnThenTh(`${current.word}`, `${th}`);
  }, [current]);

  const onPick = (opt: NumberWord) => {
    if (answered !== null) return;
    const isCorrect = opt.value === current.value;
    setAnswered(isCorrect);
    if (isCorrect) {
      speakEnglish(`Great! ${current.word}`);
      setScore((s) => s + 1);
      try { import("canvas-confetti").then((m) => m.default?.({ particleCount: 80, spread: 70, origin: { y: 0.6 } })); } catch {}
    } else {
      speakEnglish(`Let's try again. The correct answer is ${current.word}`);
    }
    const d = isCorrect ? DELAY.CORRECT_MS : DELAY.WRONG_MS;
    setTimeout(() => {
      setAnswered(null);
      if (idx + 1 < order.length) {
        setIdx(idx + 1);
      } else {
        setIdx(order.length); // จบแบบทดสอบ
      }
    }, d);
  };

  const resetQuiz = () => {
    setOrder(shuffleArray(NUMBERS.map((_, i) => i)));
    setIdx(0);
    setScore(0);
  };

  const finished = idx >= order.length;

  if (finished) {
    const percent = Math.round((score / NUMBERS.length) * 100);
    return (
      <div className={`w-full max-w-xl mx-auto text-center p-1 rounded-3xl bg-gradient-to-br ${KID_PALETTE[0].gradient}`}>
        <Card className={`rounded-2xl ${KID_PALETTE[0].cardBg} ring-4 ${KID_PALETTE[0].ring}`}>
          <CardHeader>
            <div className="text-2xl font-bold">สรุปผลการทดสอบ</div>
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-extrabold">{score} / {NUMBERS.length}</div>
            <div className="mt-3">
              <Progress className="h-4" value={percent} />
              <div className="mt-2 text-lg">ทำได้ {percent}%</div>
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Button onClick={resetQuiz} className="text-base">
              <RotateCcw className="mr-2" /> เริ่มใหม่
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-xl mx-auto select-none p-1 rounded-3xl bg-gradient-to-br ${palette.gradient}`}>
      <Card className={`rounded-2xl ${palette.cardBg} ring-4 ${palette.ring}`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg">ทดสอบข้อที่ {idx + 1} / {order.length}</div>
          <div className="flex gap-2">
            <Button variant="secondary" size="icon" onClick={speakPrompt} aria-label="ออกเสียง">
              <Volume2 />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-sm opacity-70">เลือกคำศัพท์ที่ถูกต้อง</div>
            <div className={`mt-2 text-6xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br ${palette.gradient}`}>{current.value}</div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              {options.map((opt) => {
                const isCorrect = answered !== null && opt.value === current.value;
                const isWrong = answered === false && opt.value !== current.value;
                return (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onPick(opt)}
                    className={`rounded-2xl border p-4 text-2xl font-semibold lowercase focus:outline-none focus:ring-2 focus:ring-offset-2 transition 
                      ${isCorrect ? "bg-green-100 border-green-400" : ""}
                      ${isWrong ? "bg-red-100 border-red-400" : ""}
                    `}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl">{opt.word}</span>
                      {isCorrect && <Check className="w-6 h-6" />}
                      {isWrong && <X className="w-6 h-6" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="grow">
            <Progress value={(idx / order.length) * 100} className="h-3" />
          </div>
          <div className="ml-3 text-sm opacity-70">คะแนน: {score}</div>
        </CardFooter>
      </Card>
    </div>
  );
}

// -------------------- App Root --------------------
export default function NumberTrainerApp() {
  const [mode, setMode] = useState<"learn" | "quiz">(() => (localStorage.getItem(STORE_KEY.mode) as any) || "learn");
  const [learnIndex, setLearnIndex] = useState<number>(() => Number(localStorage.getItem(STORE_KEY.learnIndex) ?? 0));

  useEffect(() => localStorage.setItem(STORE_KEY.mode, mode), [mode]);
  useEffect(() => localStorage.setItem(STORE_KEY.learnIndex, String(learnIndex)), [learnIndex]);

  const onShuffle = () => setLearnIndex(() => Math.floor(Math.random() * NUMBERS.length));

  // warm-up เสียงบนบางเบราว์เซอร์ที่ต้องการ interaction ก่อน
  const warmed = useRef(false);
  const warmUp = () => {
    if (!warmed.current) {
      try {
        const synth = window?.speechSynthesis;
        synth?.cancel();
        synth?.getVoices(); // กระตุ้นโหลดเสียงทั้ง EN/TH
      } catch {}
      warmed.current = true;
    }
  };

  return (
    <>
      <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100" onMouseDown={warmUp} onTouchStart={warmUp}>
        <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
          <Header mode={mode} onToggleMode={setMode} />

          <div className="mt-4">
            {mode === "learn" ? (
              <div>
                <Flashcard index={learnIndex} onIndex={setLearnIndex} onShuffle={onShuffle} />
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button variant="outline" onClick={() => setLearnIndex(0)} className="text-base">
                    <RotateCcw className="mr-2" /> เริ่มจาก 1 ใหม่
                  </Button>
                  <Button variant="default" onClick={() => setMode("quiz")} className="text-base">
                    <Play className="mr-2" /> ไปทำแบบทดสอบ
                  </Button>
                </div>
              </div>
            ) : (
              <Quiz />
            )}
          </div>

          <footer className="mt-8 text-center text-xs opacity-60">
            แนะนำ: แตะรูปการ์ดเพื่อพลิก / ปุ่มลำโพงเพื่อฟังเสียงอังกฤษ➜ไทย
          </footer>
        </div>
      </div>
    </>
  );
}
