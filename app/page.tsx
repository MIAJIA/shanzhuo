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

        {!result && !dadResult && (
          <div className="mt-12 pb-8 space-y-4 font-serif text-[13px] leading-[2] text-[var(--ink-faint)]">
            {mode === "politics" ? (
              <>
                <p>
                  饭桌上，他们高谈阔论，
                  <br />
                  甩出一些政治经济的观点——
                  <br />
                  有时候是错的，但没人去较真。
                </p>
                <p>
                  文化惯性在阻止我们参与这些讨论。
                  <br />
                  但那些影响物价涨跌、左右我们饭碗和手里投资的规则，
                  <br />
                  本质是一张隐形的权力地图。
                </p>
                <p>
                  我们讲女权，很多时候讲的其实是解释权。
                  <br />
                  这不只是要在场，而是要输出，要影响，要行动。
                </p>
                <p>
                  你想掌握资源，就必须参与信息的流通——
                  <br />
                  这才是上桌的本质。
                </p>
                <p>
                  五分钟查一个官网数据，
                  <br />
                  比沉默体面，比愤怒有力。
                </p>
                <p className="italic">You must be the person in that room.</p>
              </>
            ) : (
              <>
                <p>他们说教，是因为他们需要你活在他们构建的世界里。</p>
                <p>
                  反驳本身没有问题——
                  <br />
                  问题是你站在哪里反驳。
                  <br />
                  从他的框架里往外推，你永远是困兽。
                  <br />
                  但从自己的地基上开口，那叫上桌。
                </p>
                <p>
                  我的意义不存在于他的世界之中，
                  <br />
                  而仅仅存在于我的选择和行动之中。
                </p>
                <p>
                  别人的说教，就让他说好了。
                  <br />
                  不要问意义在哪里，而是自己去活出它。
                </p>
                <p className="italic">世界的意义，必定在世界之外。</p>
              </>
            )}
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
