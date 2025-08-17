'use client';

import React, { useEffect, useRef, useState } from "react";
import { RotateCcw, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "./Header";
import Flashcard from "./Flashcard";
import Quiz from "./Quiz";
import { NUMBERS, STORE_KEY } from "@/lib/numbers";

export default function NumberTrainerApp() {
  const [mode, setMode] = useState<"learn" | "quiz">(
    () =>
      (typeof window !== "undefined"
        ? (localStorage.getItem(STORE_KEY.mode) as "learn" | "quiz" | null)
        : null) || "learn"
  );
  const [learnIndex, setLearnIndex] = useState<number>(() =>
    typeof window !== "undefined"
      ? Number(localStorage.getItem(STORE_KEY.learnIndex) ?? 0)
      : 0
  );

  useEffect(() => localStorage.setItem(STORE_KEY.mode, mode), [mode]);
  useEffect(
    () => localStorage.setItem(STORE_KEY.learnIndex, String(learnIndex)),
    [learnIndex]
  );

  const onShuffle = () =>
    setLearnIndex(() => Math.floor(Math.random() * NUMBERS.length));

  const warmed = useRef(false);
  const warmUp = () => {
    if (!warmed.current) {
      try {
        const synth = window?.speechSynthesis;
        synth?.cancel();
        synth?.getVoices();
      } catch {}
      warmed.current = true;
    }
  };

  return (
    <>
      <div
        className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100"
        onMouseDown={warmUp}
        onTouchStart={warmUp}
      >
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

