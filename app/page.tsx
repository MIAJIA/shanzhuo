"use client";
import { useState, useEffect } from "react";
import { QueryInput } from "@/components/QueryInput";
import { ResultCard } from "@/components/ResultCard";
import { DadResultCard } from "@/components/DadResultCard";
import type { CheckResult, DadResult } from "@/types";

type Mode = "politics" | "dad";

const STATUS_MESSAGES = [
  "正在检索最新数据…",
  "正在比对权威信源…",
  "正在分析逻辑结构…",
  "正在整理回应角度…",
];

const DAD_STATUS_MESSAGES = [
  "正在识别话术模式…",
  "正在分析真实意图…",
  "正在准备回应方案…",
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("politics");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [dadResult, setDadResult] = useState<DadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusIndex, setStatusIndex] = useState(0);

  const showSweep = loading && !streamText && !result && !dadResult;
  const messages = mode === "politics" ? STATUS_MESSAGES : DAD_STATUS_MESSAGES;

  useEffect(() => {
    if (!showSweep) return;
    setStatusIndex(0);
    const id = setInterval(
      () => setStatusIndex((i) => (i + 1) % messages.length),
      5500,
    );
    return () => clearInterval(id);
  }, [showSweep, messages.length]);

  // reset results on mode switch
  const switchMode = (next: Mode) => {
    setMode(next);
    setResult(null);
    setDadResult(null);
    setStreamText("");
    setError(null);
  };

  const readStream = async (
    res: Response,
    onResult: (data: unknown) => void,
  ) => {
    if (!res.body) return;
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
            onResult(event.data);
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
  };

  const handleSubmit = async (claim: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setDadResult(null);
    setStreamText("");

    try {
      const endpoint = mode === "politics" ? "/api/check" : "/api/dad";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json();
        setError(data.error ?? "请求失败，请稍后重试");
        return;
      }

      if (mode === "politics") {
        await readStream(res, (data) => setResult(data as CheckResult));
      } else {
        await readStream(res, (data) => setDadResult(data as DadResult));
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

      <div className="flex border-b border-[var(--border)]">
        {(
          [
            { key: "politics", label: "政经查证" },
            { key: "dad", label: "爹味破防" },
          ] as { key: Mode; label: string }[]
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => switchMode(tab.key)}
            className={`flex-1 py-3 font-sans text-[11px] tracking-[2px] border-none cursor-pointer transition-all ${
              mode === tab.key
                ? "bg-[var(--ink)] text-[var(--bg)]"
                : "bg-transparent text-[var(--ink-light)] hover:text-[var(--ink)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-7 py-8">
        <QueryInput
          onSubmit={handleSubmit}
          loading={loading}
          placeholder={
            mode === "politics"
              ? "输入你听到的论点，例如：人民币今年一定会大幅贬值……"
              : "输入那句话，例如：我吃过的盐比你吃过的米都多……"
          }
        />

        {showSweep && (
          <div className="mt-5">
            <div className="relative h-[1px] bg-[var(--border)] overflow-hidden">
              <div
                className="absolute top-0 h-full bg-vermillion"
                style={{ animation: "sweep 1.8s ease-in-out infinite" }}
              />
            </div>
            <p className="mt-2.5 text-[10px] tracking-[2px] text-[var(--ink-faint)] font-sans">
              {messages[statusIndex]}
            </p>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-vermillion font-serif">{error}</p>
        )}

        {streamText && !result && !dadResult && (
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

        {dadResult && (
          <div id="result">
            <DadResultCard result={dadResult} />
          </div>
        )}
      </div>
    </main>
  );
}
