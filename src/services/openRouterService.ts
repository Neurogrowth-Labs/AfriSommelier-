export async function callOpenRouter({
  prompt,
  messages,
  model = "openai/gpt-4o-mini",
  systemPrompt,
  responseFormat,
  temperature
}: {
  prompt?: string,
  messages?: any[],
  model?: string,
  systemPrompt?: string,
  responseFormat?: any,
  temperature?: number
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is missing.");
  }

  let finalMessages = messages || [];
  
  if (!messages) {
    if (systemPrompt) {
      finalMessages.push({ role: "system", content: systemPrompt });
    }
    if (prompt) {
      finalMessages.push({ role: "user", content: prompt });
    }
  }

  const payload: any = {
    model: model,
    messages: finalMessages,
  };

  if (responseFormat) {
    payload.response_format = responseFormat;
  }
  if (temperature !== undefined) {
    payload.temperature = temperature;
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "AI Studio Application"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter API error (Status ${response.status}): ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
