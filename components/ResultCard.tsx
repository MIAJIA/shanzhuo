import type { CheckResult } from "@/types";
import { StampCard } from "./StampCard";
import { ReplyTabs } from "./ReplyTabs";

const VERDICT_COLOR: Record<string, string> = {
  基本准确: "text-[#2A6B3A]",
  部分成立: "text-[var(--gold)]",
  缺乏依据: "text-vermillion",
  明显错误: "text-vermillion",
};

interface ResultCardProps {
  result: CheckResult;
}

export function ResultCard({ result }: ResultCardProps) {
  return (
    <div className="mt-8 animate-fade-up">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="font-serif text-[11px] text-[var(--ink-faint)] tracking-[2px]">
          查证结果
        </span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      <StampCard stamp="评" stampColor="vermillion">
        <p
          className={`font-serif text-2xl font-bold mb-2 ${VERDICT_COLOR[result.verdict] ?? "text-[var(--gold)]"}`}
        >
          {result.verdict}
        </p>
        {result.fallacy && (
          <span className="inline-flex items-center gap-1.5 border border-[var(--border)] px-3 py-1 text-[11px] text-[var(--ink-light)] tracking-[1px]">
            ⚑ 逻辑谬误：{result.fallacy}
          </span>
        )}
      </StampCard>

      <StampCard stamp="据" stampColor="gold">
        {result.sources.map((src, i) => (
          <div
            key={i}
            className={`py-2.5 ${i < result.sources.length - 1 ? "border-b border-[#EEE]" : ""}`}
          >
            <p className="text-[13px] leading-[1.7] text-[var(--ink)] mb-1">
              {src.text}
            </p>
            {src.url ? (
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-vermillion tracking-[1px] hover:underline"
              >
                {src.source}
              </a>
            ) : (
              <p className="text-[10px] text-vermillion tracking-[1px]">
                {src.source}
              </p>
            )}
          </div>
        ))}
      </StampCard>

      <StampCard stamp="答" stampColor="ink">
        <ReplyTabs replies={result.replies} />
      </StampCard>
    </div>
  );
}
