import axios from 'axios'

export interface FixJsonResult {
  fixedJson: string
  explanation: string
}

export async function fixJson(errorJson: string): Promise<FixJsonResult> {
  const { getEffectiveSettings } = await import('../stores/settingsStore').then(
    (m) => m.useSettingsStore.getState()
  )
  const settings = getEffectiveSettings()

  if (!settings.apiKey) {
    throw new Error('API Key 未配置,请在设置中配置 OpenAI API Key')
  }

  const response = await axios.post(
    `${settings.baseUrl}/v1/chat/completions`,
    {
      model: settings.model,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'You are a JSON repair assistant. Given invalid JSON, fix it and return a valid JSON object with two fields: "fixedJson" (the corrected JSON as a string) and "explanation" (a brief explanation of what was fixed). Return ONLY valid JSON, no markdown.',
        },
        {
          role: 'user',
          content: `Fix this JSON:\n${errorJson}`,
        },
      ],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`,
      },
    }
  )

  const content = response.data.choices[0].message.content
  let parsed: { fixedJson?: string; fixed_json?: string; explanation?: string }

  try {
    const cleaned = content.replace(/```json\s*|\s*```/g, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('AI 返回的内容无法解析')
  }

  const fixedJson = parsed.fixedJson || parsed.fixed_json
  if (!fixedJson) {
    throw new Error('AI 返回的内容缺少 fixedJson 字段')
  }

  try {
    JSON.parse(fixedJson)
  } catch {
    throw new Error('AI 修复后的 JSON 仍然不合法')
  }

  return {
    fixedJson,
    explanation: parsed.explanation || '已修复',
  }
}
