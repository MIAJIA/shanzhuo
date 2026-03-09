"use client";
import { useState } from "react";
import { QueryInput } from "@/components/QueryInput";
import { ResultCard } from "@/components/ResultCard";
import type { CheckResult } from "@/types";

export default function Home() {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (claim: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "查证失败，请稍后重试");
        return;
      }

      setResult(data);
      setTimeout(() => {
        document
          .getElementById("result")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);
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

        {result && (
          <div id="result">
            <ResultCard result={result} />
          </div>
        )}
      </div>
    </main>
  );
}
