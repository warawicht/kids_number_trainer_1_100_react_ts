'use client';

/**
 * Shared data and utilities for the Kids Number Trainer.
 */

export type NumberWord = { value: number; word: string };

// English words 1..19
const EN_ONES = [
  "zero","one","two","three","four","five","six","seven","eight","nine",
  "ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"
] as const;
// Tens 20..90
const EN_TENS = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"] as const;

export function englishWord(n: number): string {
  if (n < 20) return EN_ONES[n];
  if (n === 100) return "one hundred";
  const t = Math.floor(n / 10);
  const u = n % 10;
  return EN_TENS[t] + (u ? " " + EN_ONES[u] : "");
}

// Thai digits for units
const TH_UNITS = ["ศูนย์","หนึ่ง","สอง","สาม","สี่","ห้า","หก","เจ็ด","แปด","เก้า"] as const;
export function thaiWord(n: number): string {
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

export const NUMBERS: NumberWord[] = Array.from({ length: 100 }, (_, i) => {
  const value = i + 1;
  return { value, word: englishWord(value) };
});

// Fun colors for kids
export const KID_PALETTE = [
  { gradient: "from-pink-300 via-orange-200 to-yellow-300", ring: "ring-pink-200", cardBg: "bg-white/80 backdrop-blur" },
  { gradient: "from-sky-300 via-cyan-200 to-teal-300", ring: "ring-sky-200", cardBg: "bg-white/80 backdrop-blur" },
  { gradient: "from-violet-300 via-purple-200 to-fuchsia-300", ring: "ring-violet-200", cardBg: "bg-white/80 backdrop-blur" },
  { gradient: "from-emerald-300 via-lime-200 to-yellow-300", ring: "ring-emerald-200", cardBg: "bg-white/80 backdrop-blur" },
  { gradient: "from-rose-300 via-pink-200 to-fuchsia-300", ring: "ring-rose-200", cardBg: "bg-white/80 backdrop-blur" },
  { gradient: "from-amber-300 via-orange-200 to-red-300", ring: "ring-amber-200", cardBg: "bg-white/80 backdrop-blur" },
  { gradient: "from-indigo-300 via-blue-200 to-sky-300", ring: "ring-indigo-200", cardBg: "bg-white/80 backdrop-blur" },
];

// -------------------- Utils --------------------
export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sampleDistinct<T>(pool: T[], count: number, exclude: (x: T) => boolean): T[] {
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

export function speakEnglish(text: string, rate = 0.9) {
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

export function speakEnThenTh(enText: string, thText: string, rateEn = 0.9, rateTh = 0.9) {
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
export function speakOnceEnTh(key: string, enText: string, thText: string) {
  const now = Date.now();
  if (__speakGuard.lastKey === key && now - __speakGuard.lastAt < 350) return;
  __speakGuard.lastKey = key;
  __speakGuard.lastAt = now;
  speakEnThenTh(enText, thText);
}

// -------------------- Storage --------------------
export const STORE_KEY = {
  mode: "kids-number-trainer:mode",
  learnIndex: "kids-number-trainer:learnIndex",
  quizIndex: "kids-number-trainer:quizIndex",
  quizOrder: "kids-number-trainer:quizOrder",
  score: "kids-number-trainer:score",
} as const;

// -------------------- Timing --------------------
export const DELAY = { CORRECT_MS: 3000, WRONG_MS: 5000 } as const;

// -------------------- Dev Self-Tests --------------------
function runDevSelfTests() {
  try {
    console.groupCollapsed("[KNT] self-tests");
    console.assert(NUMBERS.length === 100, "NUMBERS should have 100 items");
    const values = NUMBERS.map((n) => n.value);
    const uniq = new Set(values);
    console.assert(uniq.size === 100, "values should be unique 1..100");
    console.assert(englishWord(21) === "twenty one", "EN 21 should be 'twenty one'");
    console.assert(englishWord(40) === "forty", "EN 40 should be 'forty'");
    console.assert(englishWord(100) === "one hundred", "EN 100 should be 'one hundred'");
    console.assert(thaiWord(11) === "สิบเอ็ด", "TH 11 should be 'สิบเอ็ด'");
    console.assert(thaiWord(21) === "ยี่สิบเอ็ด", "TH 21 should be 'ยี่สิบเอ็ด'");
    console.assert(thaiWord(40) === "สี่สิบ", "TH 40 should be 'สี่สิบ'");
    console.assert(thaiWord(100) === "หนึ่งร้อย", "TH 100 should be 'หนึ่งร้อย'");
    const arr = [1, 2, 3];
    const shuffled = shuffleArray(arr);
    console.assert(arr.join(",") === "1,2,3", "shuffleArray must not mutate input");
    console.assert(shuffled.length === 3, "shuffleArray length holds");
    const sampled = sampleDistinct(NUMBERS, 2, (x) => x.value === 5);
    console.assert(sampled.every((x) => x.value !== 5), "sampleDistinct respects exclude");
    console.assert(sampleDistinct(NUMBERS, 0, () => false).length === 0, "sampleDistinct count 0 returns empty");
    console.assert(englishWord(99) === "ninety nine", "EN 99 should be 'ninety nine'");
    console.assert(thaiWord(99) === "เก้าสิบเก้า", "TH 99 should be 'เก้าสิบเก้า'");
    console.assert(DELAY.CORRECT_MS === 3000, "Correct delay should be 3000ms");
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

