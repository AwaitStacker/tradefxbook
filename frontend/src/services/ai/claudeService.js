// src/services/ai/claudeService.js
// Future: add geminiService.js, openaiService.js with same interface

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL             = "claude-sonnet-4-20250514";
const MAX_TOKENS        = 3000;

/**
 * Sends a prompt to the Anthropic Claude API.
 * Returns raw text response or throws on HTTP error.
 * Provider-agnostic interface: { prompt, apiKey } → rawText
 */
export const callClaudeAPI = async ({ prompt, apiKey }) => {
  const response = await fetch(ANTHROPIC_API_URL, {
    method:  "POST",
    headers: {
      "Content-Type":      "application/json",
      "x-api-key":         apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      messages:   [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  return data.content?.map(b => b.text || "").join("").trim();
};