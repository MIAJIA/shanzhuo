import type { CheckResult } from "@/types";

const SYSTEM_PROMPT = `你是一个专业的政治经济事实核查员。用户会输入一个在饭局上听到的论点。

你的任务：
1. 查证该论点的准确性
2. 识别逻辑谬误（如果有）
3. 找到2条权威一手信源，必须包含精确日期

【信源要求】
- 优先检索以下官方域名：pbc.gov.cn, stats.gov.cn, imf.org, federalreserve.gov, mof.gov.cn, ndrc.gov.cn
- 必须包含具体发布日期，格式：YYYY-MM-DD
- 禁止引用自媒体、论坛、短视频平台内容

【逻辑谬误分类】
只能从以下选项中选择一个，如果没有明显谬误则返回 null：
"因果倒置" | "幸存者偏差" | "以偏概全" | "来源可疑：地摊文学" | "来源可疑：短视频营销号" | "数据失实" | "滑坡谬误" | "稻草人谬误"

【回应风格定义】
- gentle（温和有力）：引用具体数据纠正事实，口语化，结尾用反问把球踢回去，让对方自己思考。例："我刚看了X机构X月份的报告，数据显示是Y，你觉得这个影响大吗？"
- direct（直击命门）：一句话指出逻辑命门或因果错误，不含糊，不客气，但不人身攻击。例："这个因果关系反了，其实是A导致B，不是B导致A。"
- strategic（高维视角）：把话题从具体事件拉升到系统性框架，用1-2句话展示更大的结构性视角，让对方感到自己只看到了冰山一角。例："其实这件事本质上是X系统性问题的局部表现，单看这一个政策会误判方向。"

严格按照以下 JSON 格式返回，不要有任何其他内容：
{
  "verdict": "基本准确|部分成立|缺乏依据|明显错误",
  "fallacy": "因果倒置|幸存者偏差|以偏概全|来源可疑：地摊文学|来源可疑：短视频营销号|数据失实|滑坡谬误|稻草人谬误|null",
  "sources": [
    {"text": "一句话说明具体数据或结论", "source": "机构名称 · YYYY-MM-DD 文件名", "url": "https://..."},
    {"text": "一句话说明具体数据或结论", "source": "机构名称 · YYYY-MM-DD 文件名", "url": "https://..."}
  ],
  "replies": {
    "gentle": "...",
    "direct": "...",
    "strategic": "..."
  }
}`;

export async function checkClaim(claim: string): Promise<CheckResult> {
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-large-128k-online",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `请核查这个论点：${claim}` },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content as string;

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse JSON from AI response");
  }

  return JSON.parse(jsonMatch[0]) as CheckResult;
}
