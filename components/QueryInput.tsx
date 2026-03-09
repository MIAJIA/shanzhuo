"use client";
import { useState } from "react";

interface QueryInputProps {
  onSubmit: (claim: string) => void;
  loading: boolean;
  placeholder?: string;
}

export function QueryInput({
  onSubmit,
  loading,
  placeholder,
}: QueryInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim() && !loading) {
      onSubmit(value.trim());
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
          placeholder={
            placeholder ?? "输入你听到的论点，例如：人民币今年一定会大幅贬值……"
          }
          rows={3}
          className="w-full bg-transparent border-none outline-none text-[var(--ink)] font-serif text-[15px] leading-[1.8] resize-none placeholder:text-[var(--ink-faint)] placeholder:font-light"
        />
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
