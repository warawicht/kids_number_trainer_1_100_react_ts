import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Shuffle, StepBack, StepForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  NUMBERS,
  KID_PALETTE,
  thaiWord,
  speakEnThenTh,
  speakOnceEnTh,
} from "@/lib/numbers";

export default function Flashcard({
  index,
  onIndex,
  onShuffle,
}: {
  index: number;
  onIndex: (i: number) => void;
  onShuffle: () => void;
}) {
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
          <Button
            variant="ghost"
            onClick={() => onIndex((index + 1) % NUMBERS.length)}
            className="text-base"
          >
            ถัดไป <StepForward className="ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

