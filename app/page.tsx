"use client";
import { useState } from "react";
import { QueryInput } from "@/components/QueryInput";
import { ResultCard } from "@/components/ResultCard";
import type { CheckResult } from "@/types";

export default function Home() {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (claim: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setStreamText("");

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json();
        setError(data.error ?? "查证失败，请稍后重试");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "chunk") {
              setStreamText((t) => t + event.text);
            } else if (event.type === "result") {
              setResult(event.data);
              setStreamText("");
              setTimeout(() => {
                document
                  .getElementById("result")
                  ?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            } else if (event.type === "error") {
              setError(event.message);
            }
          } catch {
            // skip malformed line
          }
        }
      }
    } catch {
      setError("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <header className="px-7 pt-8 pb-5 border-b border-[var(--border)] relative after:content-[''] after:absolute after:bottom-[-2px] after:left-7 after:w-10 after:h-0.5 after:bg-vermillion">
        <h1 className="font-serif text-2xl font-bold tracking-[6px] mb-1">
          上　桌
        </h1>
        <p className="text-[10px] tracking-[2px] text-[var(--ink-faint)] font-light">
          You Belong At The Table · 饭局情报
        </p>
      </header>

      <div className="px-7 py-8">
        <QueryInput onSubmit={handleSubmit} loading={loading} />

        {error && (
          <p className="mt-4 text-sm text-vermillion font-serif">{error}</p>
        )}

        {streamText && !result && (
          <div className="mt-6 border-l-2 border-[var(--border)] pl-3.5">
            <p className="text-[10px] tracking-[2px] text-[var(--ink-faint)] font-sans mb-2">
              查证中…
            </p>
            <p className="font-serif text-sm leading-[1.9] text-[var(--ink-light)] whitespace-pre-wrap">
              {streamText}
            </p>
          </div>
        )}

        {result && (
          <div id="result">
            <ResultCard result={result} />
          </div>
        )}
      </div>
    </main>
  );
}
