"use client";
import { useState } from "react";
import type { Recency } from "@/lib/gemini";

const RECENCY_OPTIONS: { value: Recency; label: string }[] = [
  { value: "1d", label: "24小时" },
  { value: "1w", label: "一周" },
  { value: "1m", label: "一个月" },
  { value: "3m", label: "三个月" },
  { value: "1y", label: "一年" },
];

interface QueryInputProps {
  onSubmit: (claim: string, recency: Recency) => void;
  loading: boolean;
}

export function QueryInput({ onSubmit, loading }: QueryInputProps) {
  const [value, setValue] = useState("");
  const [recency, setRecency] = useState<Recency>("1m");

  const handleSubmit = () => {
    if (value.trim() && !loading) {
      onSubmit(value.trim(), recency);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3.5 font-serif text-xs tracking-[2px] text-[var(--ink-light)]">
        <span className="inline-flex items-center justify-center w-[22px] h-[22px] bg-vermillion text-white font-serif text-[11px] flex-shrink-0">
          问
        </span>
        他说了什么
      </div>
      <div className="border border-[var(--border)] bg-white p-[18px_20px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)]">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="输入你听到的论点，例如：人民币今年一定会大幅贬值……"
          rows={3}
          className="w-full bg-transparent border-none outline-none text-[var(--ink)] font-serif text-[15px] leading-[1.8] resize-none placeholder:text-[var(--ink-faint)] placeholder:font-light"
        />
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]">
          <span className="text-[10px] tracking-[1px] text-[var(--ink-faint)] font-sans flex-shrink-0">
            查近期
          </span>
          {RECENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRecency(opt.value)}
              className={`px-2.5 py-1 text-[10px] tracking-[1px] border transition-all cursor-pointer font-sans ${
                recency === opt.value
                  ? "bg-[var(--ink)] border-[var(--ink)] text-[var(--bg)]"
                  : "bg-transparent border-[var(--border)] text-[var(--ink-faint)] hover:border-[var(--ink-light)] hover:text-[var(--ink-light)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || loading}
        className="block w-full mt-4 py-4 bg-[var(--ink)] text-[var(--bg)] font-serif text-sm tracking-[6px] cursor-pointer transition-colors hover:bg-[#2C2A26] disabled:opacity-40 disabled:cursor-not-allowed border-none"
      >
        {loading ? "查　证　中…" : "查　一　下"}
      </button>
    </div>
  );
}
