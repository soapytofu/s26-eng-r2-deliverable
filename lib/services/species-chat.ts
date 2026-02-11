/* eslint-disable */
// the API route calls generateResponse() and generateResponse() is responsible for talking to the LLM provider

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_INSTRUCTION =
  "You are a helpful chatbot that ONLY answers questions about animals, species, habitat, diet, conservation status, and related facts. " +
  "If the user asks something unrelated, politely explain that you can only help with animal/species-related questions and ask them to rephrase.";

// used to distinguish provider/upstream failures from other kinds of errors
export class ChatProviderError extends Error {
  name = "ChatProviderError";
}

export async function generateResponse(message: string): Promise<string> {
  try {
    if (!OPENAI_API_KEY) {
      // feature 3 - treat missing configuration as a provider error so the API can return a 502.
      throw new ChatProviderError("Missing OPENAI_API_KEY. Set it in .env and restart the dev server.");
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user", content: message },
        ],
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const text = await res.text();

      try {
        const parsed = JSON.parse(text) as {
          error?: { code?: string; message?: string };
        };
        const code = parsed.error?.code;
        if (res.status === 429 && code === "insufficient_quota") {
          throw new ChatProviderError(
            "OpenAI quota/billing exceeded for this API key. Add billing/credits in the OpenAI dashboard or use a different provider/key.",
          );
        }
      } catch {}

      throw new ChatProviderError(`OpenAI error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new ChatProviderError("Empty response from provider.");
    }

    return content;
  } catch (err) {
    console.error("generateResponse failed", err);
    if (err instanceof ChatProviderError) throw err;
    throw new ChatProviderError("Provider request failed.");
  }
}
