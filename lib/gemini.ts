import type { CheckResult } from "@/types";

const GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro";

function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

function buildResearchPrompt(): string {
  const today = getCurrentDate();

  return `你是一个政治经济事实核查员。用户提出一个论点，你需要用最新数据核查它。

今天是 ${today}。请用 Google Search 查找最新的数据和报告，尽量引用近期发布的内容，但也可以根据论点性质灵活选择最相关的时间范围。

请提供：
1. 这个论点的准确性判断（基本准确/部分成立/缺乏依据/明显错误）
2. 最符合的逻辑谬误（如有），从以下选：因果倒置/幸存者偏差/以偏概全/来源可疑：地摊文学/来源可疑：短视频营销号/数据失实/滑坡谬误/稻草人谬误
3. 2条权威信源（央行、统计局、IMF、美联储等官网），必须注明精确发布日期
4. 关键数据点：具体数字、百分比、全球横向对比（其他国家同期数据）

用中文输出，格式自由，尽可能具体。`;
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

// Step 1: streaming call with google_search
export async function* geminiStream(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
): AsyncGenerator<string> {
  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
  };

  const response = await fetch(`${GEMINI_BASE}:streamGenerateContent?alt=sse`, {
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

  const reader = response.body!.getReader();
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
      const json = line.slice(6).trim();
      if (json === "[DONE]") return;
      try {
        const chunk = JSON.parse(json);
        const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield text;
      } catch {
        // skip malformed chunk
      }
    }
  }
}

// Step 2: non-streaming JSON call
async function geminiJson(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(`${GEMINI_BASE}:generateContent`, {
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

export type StreamEvent =
  | { type: "chunk"; text: string }
  | { type: "result"; data: CheckResult }
  | { type: "error"; message: string };

// ── 爹味破防 ──────────────────────────────────────────────

import type { DadResult } from "@/types";

const DAD_PROMPT = `你是一个专门分析"爹味说教"话术的顾问。用户会输入一句典型的爹味语录，你需要：

1. 识别话术模式，从以下选一个最贴合的：
   权威压制 / 经验绑架 / 年龄歧视 / 恐吓式预言 / 否定式说教 / 代际比较 / 条件施压 / 虚假关心

2. translation：一句话揭穿这句话的真实意图，去掉包装直说内核。语气犀利但不愤怒。

3. 三种回应（每种 1-2 句话，克制、有力、不失礼）：
   - projection（看穿投射）：老登说的往往是自己年轻时的遗憾，不是在评价你。温柔但精准地点出这一层，让对方和在场的人都若有所思。
   - counter（反问破防）：一个问题让对方答不上来，或意识到自己逻辑有漏洞。适合有余力时用。
   - aerial（云端俯视）：用轻描淡写的幽默把对方的逻辑架空。不愤怒，不正面冲突，但在场的人都懂了——就是那种笑着让人说不下去的感觉。

只输出如下纯 JSON，不要任何解释或 markdown：
{"pattern":"权威压制","translation":"...","replies":{"projection":"...","counter":"...","aerial":"..."}}`;

export type DadStreamEvent =
  | { type: "chunk"; text: string }
  | { type: "result"; data: DadResult }
  | { type: "error"; message: string };

export async function* checkDadStream(
  claim: string,
): AsyncGenerator<DadStreamEvent> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const formatted = await geminiJson(apiKey, DAD_PROMPT, `这句话是：${claim}`);

  const jsonMatch = formatted.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse JSON from Gemini response");

  yield { type: "result", data: JSON.parse(jsonMatch[0]) as DadResult };
}

export async function* checkClaimStream(
  claim: string,
): AsyncGenerator<StreamEvent> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  // Step 1: stream research text
  let research = "";
  for await (const chunk of geminiStream(
    apiKey,
    buildResearchPrompt(),
    `请核查这个论点：${claim}`,
  )) {
    research += chunk;
    yield { type: "chunk", text: chunk };
  }

  // Step 2: format into JSON (non-streaming, JSON mode)
  const formatted = await geminiJson(
    apiKey,
    FORMAT_PROMPT,
    `研究内容：\n${research}\n\n原始论点：${claim}`,
  );

  const jsonMatch = formatted.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse JSON from Gemini response");

  yield { type: "result", data: JSON.parse(jsonMatch[0]) as CheckResult };
}
