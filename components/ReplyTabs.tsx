"use client";
import { useState } from "react";

interface ReplyTabsProps {
  replies: {
    gentle: string;
    direct: string;
    strategic: string;
  };
}

const TABS = [
  { key: "gentle" as const, label: "温和有力" },
  { key: "direct" as const, label: "直击命门" },
  { key: "strategic" as const, label: "高维视角" },
];

export function ReplyTabs({ replies }: ReplyTabsProps) {
  const [active, setActive] = useState<"gentle" | "direct" | "strategic">(
    "gentle",
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(replies[active]).then(() => {
      // Haptic feedback on mobile
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
                ? "bg-[var(--ink)] border-[var(--ink)] text-[var(--bg)]"
                : "bg-transparent border-[var(--border)] text-[var(--ink-light)] hover:border-[var(--ink-light)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <p className="font-serif text-sm leading-[1.9] text-[var(--ink)] min-h-[72px] border-l-2 border-vermillion pl-3.5">
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
