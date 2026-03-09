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
三种回应都必须包含具体数字、时间或对比数据，禁止泛泛而谈。

- gentle（温和有力）：口语化，引用具体数字纠正事实，然后用反问把球踢回去。必须有具体的数据点（百分比/指数/排名/金额），不能只说"数据显示有压力"。例："我刚看了IMF去年12月的报告，同期日本、韩国股市跌幅其实更大，所以不只是咱们这边的问题，你觉得外部环境的影响有多大？"

- direct（直击命门）：一句话精准反驳，必须指出具体的反例或被忽略的因素，不能只说"原因是多方面的"。例："2023年美联储加息17次期间，全球主要股市普跌，A股同期跑赢了德国DAX和日经225，单说政策问题站不住脚。"

- strategic（高维视角/降维打击）：把论点放进更大的全球或历史坐标系里，用具体对比让对方意识到自己只看到了局部。必须点名至少一个横向对比（其他国家/历史时期/其他资产类别）并附具体数据。例："其实同期标普500从高点也回撤了25%，全球资本都在重新定价利率风险，把锅全甩给国内政策，是忽略了美联储2022年以来最激进加息周期的背景。"

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
