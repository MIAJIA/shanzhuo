import type { CheckResult } from "@/types";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export type Recency = "1d" | "1w" | "1m" | "3m" | "1y";

function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

function getRecencyLabel(recency: Recency): string {
  const labels: Record<Recency, string> = {
    "1d": "过去24小时",
    "1w": "过去一周",
    "1m": "过去一个月",
    "3m": "过去三个月",
    "1y": "过去一年",
  };
  return labels[recency];
}

function buildResearchPrompt(recency: Recency): string {
  const today = getCurrentDate();
  const recencyLabel = getRecencyLabel(recency);

  return `你是一个政治经济事实核查员。用户提出一个论点，你需要用最新数据核查它。

今天是 ${today}。请用 Google Search 优先查找【${recencyLabel}】内发布的数据和报告。

请提供：
1. 这个论点的准确性判断（基本准确/部分成立/缺乏依据/明显错误）
2. 最符合的逻辑谬误（如有），从以下选：因果倒置/幸存者偏差/以偏概全/来源可疑：地摊文学/来源可疑：短视频营销号/数据失实/滑坡谬误/稻草人谬误
3. 2条权威信源（央行、统计局、IMF、美联储等官网），必须注明精确发布日期
4. 关键数据点：具体数字、百分比、全球横向对比（其他国家同期数据）

用中文输出，格式自由，尽可能具体，优先引用 ${today} 前 ${recencyLabel} 的最新数字。`;
}

// Step 2: Format research into structured JSON
const FORMAT_PROMPT = `你是一个 JSON 格式化助手。根据以下研究内容，生成规范 JSON。

【回应风格要求】（前三种风格都必须包含具体数字和全球对比，禁止泛泛而谈）
- gentle：口语化，引用具体最新数字，结尾反问把球踢回去。必须有具体数据点和全球横向对比。
- direct：一句话精准反驳，必须指出具体反例或被忽略的最新数据，不能说"原因是多方面的"。
- strategic：把论点放进全球或历史坐标系，必须点名至少一个横向对比（其他国家/历史时期）并附最新具体数据，让对方意识到只看到了局部。
- sarcastic：暗讽风格。表面上顺着对方说，实则用一个反转细节轻轻戳穿。语气云淡风轻，不正面冲突，但讽刺感要让人回味一两秒才能懂。控制在1-2句话，不要太用力，留白比爆破更有杀伤力。例："哦对，就像当年说房价只会涨的那批人，后来也用同样的逻辑解释为什么它跌的。"

只输出如下纯 JSON，不要有任何解释或 markdown：
{"verdict":"基本准确","fallacy":"null","sources":[{"text":"说明","source":"机构 · YYYY-MM-DD 文件名","url":"https://..."},{"text":"说明","source":"机构 · YYYY-MM-DD 文件名","url":"https://..."}],"replies":{"gentle":"...","direct":"...","strategic":"...","sarcastic":"..."}}`;

async function geminiCall(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  options: {
    useSearch?: boolean;
    jsonMode?: boolean;
  } = {},
): Promise<string> {
  const body: Record<string, unknown> = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
      ...(options.jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };

  if (options.useSearch) {
    body.tools = [{ google_search: {} }];
  }

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function checkClaim(
  claim: string,
  recency: Recency = "1m",
): Promise<CheckResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  // Step 1: Real-time research with Google Search
  const research = await geminiCall(
    apiKey,
    buildResearchPrompt(recency),
    `请核查这个论点：${claim}`,
    { useSearch: true },
  );

  // Step 2: Format research into structured JSON
  const formatted = await geminiCall(
    apiKey,
    FORMAT_PROMPT,
    `研究内容：\n${research}\n\n原始论点：${claim}`,
    { jsonMode: true },
  );

  const jsonMatch = formatted.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse JSON from Gemini response");
  }

  return JSON.parse(jsonMatch[0]) as CheckResult;
}
