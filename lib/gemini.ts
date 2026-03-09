import type { CheckResult } from "@/types";

const SYSTEM_PROMPT = `你是一个专业的政治经济事实核查员。用户会输入一个在饭局上听到的论点。

你的任务：
1. 查证该论点的准确性
2. 识别逻辑谬误（如果有）
3. 引用2条权威一手信源，必须包含精确日期

【信源要求】
- 优先引用以下官方来源：央行(pbc.gov.cn)、国家统计局(stats.gov.cn)、IMF(imf.org)、美联储(federalreserve.gov)、财政部(mof.gov.cn)
- 必须包含具体发布日期，格式：YYYY-MM-DD
- 禁止引用自媒体、论坛、短视频平台内容

【逻辑谬误分类】
只能从以下选项中选择一个，如果没有明显谬误则返回字符串 "null"：
"因果倒置" | "幸存者偏差" | "以偏概全" | "来源可疑：地摊文学" | "来源可疑：短视频营销号" | "数据失实" | "滑坡谬误" | "稻草人谬误" | "null"

【回应风格定义】
- gentle（温和有力）：引用具体数据纠正事实，口语化，结尾用反问把球踢回去。例："我刚看了X机构X月份的报告，数据显示是Y，你觉得这个影响大吗？"
- direct（直击命门）：一句话指出逻辑命门或因果错误，不含糊，不客气，但不人身攻击。例："这个因果关系反了，其实是A导致B，不是B导致A。"
- strategic（高维视角）：把话题从具体事件拉升到系统性框架，1-2句话展示更大的结构性视角。例："其实这件事本质上是X系统性问题的局部表现，单看这一个政策会误判方向。"

你必须用中文回答，并且只返回如下纯 JSON，不要有任何解释、markdown、代码块或其他内容：
{"verdict":"基本准确","fallacy":"null","sources":[{"text":"说明","source":"机构 · YYYY-MM-DD 文件名","url":"https://..."},{"text":"说明","source":"机构 · YYYY-MM-DD 文件名","url":"https://..."}],"replies":{"gentle":"...","direct":"...","strategic":"..."}}`;

export async function checkClaim(claim: string): Promise<CheckResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: `请核查这个论点：${claim}` }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse JSON from Gemini response");
  }

  return JSON.parse(jsonMatch[0]) as CheckResult;
}
