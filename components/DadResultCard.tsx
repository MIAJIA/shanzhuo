"use client";
import { useState } from "react";
import type { DadResult } from "@/types";
import { StampCard } from "./StampCard";

type ReplyKey = "deflect" | "counter" | "exit";

const TABS: { key: ReplyKey; label: string }[] = [
  { key: "deflect", label: "接招化解" },
  { key: "counter", label: "反问破防" },
  { key: "exit", label: "优雅收尾" },
];

interface DadResultCardProps {
  result: DadResult;
}

export function DadResultCard({ result }: DadResultCardProps) {
  const [active, setActive] = useState<ReplyKey>("deflect");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.replies[active]).then(() => {
      if (navigator.vibrate) navigator.vibrate(150);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mt-8 animate-fade-up">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="font-serif text-[11px] text-[var(--ink-faint)] tracking-[2px]">
          破防分析
        </span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      <StampCard stamp="识" stampColor="gold">
        <span className="inline-flex items-center border border-[var(--gold)] px-3 py-1 text-[11px] text-[var(--gold)] tracking-[2px] font-sans mb-3">
          {result.pattern}
        </span>
        <p className="font-serif text-sm leading-[1.8] text-[var(--ink-light)] italic">
          &ldquo;{result.translation}&rdquo;
        </p>
      </StampCard>

      <StampCard stamp="答" stampColor="ink">
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`px-3.5 py-1 text-[11px] tracking-[1px] border transition-all cursor-pointer font-sans ${
                active === tab.key
                  ? "bg-[var(--ink)] border-[var(--ink)] text-[var(--bg)]"
                  : "bg-transparent border-[var(--border)] text-[var(--ink-light)] hover:border-[var(--ink-light)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="font-serif text-sm leading-[1.9] text-[var(--ink)] min-h-[72px] border-l-2 border-vermillion pl-3.5">
          {result.replies[active]}
        </p>
        <button
          onClick={handleCopy}
          className="mt-3.5 px-[18px] py-2 bg-transparent border border-[var(--ink-faint)] text-[var(--ink-light)] font-sans text-[11px] tracking-[2px] cursor-pointer transition-all hover:border-[var(--ink)] hover:text-[var(--ink)]"
        >
          {copied ? "已复制 ✓" : "复制这句话"}
        </button>
      </StampCard>
    </div>
  );
}
