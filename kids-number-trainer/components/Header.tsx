import { Switch } from "@/components/ui/switch";
import { GraduationCap, Sparkles } from "lucide-react";

export default function Header({
  mode,
  onToggleMode,
}: {
  mode: "learn" | "quiz";
  onToggleMode: (m: "learn" | "quiz") => void;
}) {
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

