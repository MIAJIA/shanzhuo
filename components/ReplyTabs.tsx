"use client";
import { useState } from "react";

interface ReplyTabsProps {
  replies: {
    gentle: string;
    direct: string;
    strategic: string;
    sarcastic: string;
  };
}

type ReplyKey = "gentle" | "direct" | "strategic" | "sarcastic";

const TABS: { key: ReplyKey; label: string }[] = [
  { key: "gentle", label: "温和有力" },
  { key: "direct", label: "直击命门" },
  { key: "strategic", label: "高维视角" },
  { key: "sarcastic", label: "暗讽" },
];

export function ReplyTabs({ replies }: ReplyTabsProps) {
  const [active, setActive] = useState<ReplyKey>("gentle");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(replies[active]).then(() => {
      if (navigator.vibrate) navigator.vibrate(150);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-3.5 py-1 text-[11px] tracking-[1px] border transition-all cursor-pointer font-sans ${
              active === tab.key
                ? tab.key === "sarcastic"
                  ? "bg-[var(--gold)] border-[var(--gold)] text-white"
                  : "bg-[var(--ink)] border-[var(--ink)] text-[var(--bg)]"
                : "bg-transparent border-[var(--border)] text-[var(--ink-light)] hover:border-[var(--ink-light)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <p
        className={`font-serif text-sm leading-[1.9] text-[var(--ink)] min-h-[72px] border-l-2 pl-3.5 ${
          active === "sarcastic"
            ? "border-[var(--gold)] italic"
            : "border-vermillion"
        }`}
      >
        {replies[active]}
      </p>
      <button
        onClick={handleCopy}
        className="mt-3.5 px-[18px] py-2 bg-transparent border border-[var(--ink-faint)] text-[var(--ink-light)] font-sans text-[11px] tracking-[2px] cursor-pointer transition-all hover:border-[var(--ink)] hover:text-[var(--ink)]"
      >
        {copied ? "已复制 ✓" : "复制这句话"}
      </button>
    </div>
  );
}
