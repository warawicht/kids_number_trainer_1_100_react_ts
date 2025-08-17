import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Volume2, Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  NUMBERS,
  KID_PALETTE,
  sampleDistinct,
  shuffleArray,
  thaiWord,
  speakEnThenTh,
  speakEnglish,
  speakOnceEnTh,
  STORE_KEY,
  DELAY,
  NumberWord,
} from "@/lib/numbers";

export default function Quiz() {
  const [order, setOrder] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      const fromStore = localStorage.getItem(STORE_KEY.quizOrder);
      return fromStore ? JSON.parse(fromStore) : shuffleArray(NUMBERS.map((_, i) => i));
    }
    return shuffleArray(NUMBERS.map((_, i) => i));
  });
  const [idx, setIdx] = useState<number>(() =>
    typeof window !== "undefined" ? Number(localStorage.getItem(STORE_KEY.quizIndex) ?? 0) : 0
  );
  const [score, setScore] = useState<number>(() =>
    typeof window !== "undefined" ? Number(localStorage.getItem(STORE_KEY.score) ?? 0) : 0
  );
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
      try {
        import("canvas-confetti").then((m) =>
          m.default?.({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
        );
      } catch {}
    } else {
      speakEnglish(`Let's try again. The correct answer is ${current.word}`);
    }
    const d = isCorrect ? DELAY.CORRECT_MS : DELAY.WRONG_MS;
    setTimeout(() => {
      setAnswered(null);
      if (idx + 1 < order.length) {
        setIdx(idx + 1);
      } else {
        setIdx(order.length);
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

