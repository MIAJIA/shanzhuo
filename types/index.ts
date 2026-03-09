export type Verdict = "基本准确" | "部分成立" | "缺乏依据" | "明显错误";

export type Fallacy =
  | "因果倒置"
  | "幸存者偏差"
  | "以偏概全"
  | "来源可疑：地摊文学"
  | "来源可疑：短视频营销号"
  | "数据失实"
  | "滑坡谬误"
  | "稻草人谬误"
  | null;

export interface Source {
  text: string; // one-sentence summary
  source: string; // e.g. "中国人民银行 · 2026-01-20 汇率报告"
  url?: string;
}

export interface CheckResult {
  verdict: Verdict;
  fallacy: Fallacy;
  sources: Source[];
  replies: {
    gentle: string; // 温和有力
    direct: string; // 直击命门
    strategic: string; // 高维视角
  };
}

export interface CheckRequest {
  claim: string;
}
