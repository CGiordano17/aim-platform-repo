import "server-only";
import type { Question } from "@/lib/types";

// Server-side only — PRD §6.2 requires the text-answer scoring call to move
// server-side in production to protect the API key (the prototype called
// api.anthropic.com directly from the browser with no key at all, which only
// worked because it ran inside a Claude.ai artifact sandbox). The
// "server-only" import makes it a build error to ever import this from a
// Client Component.
export async function scoreTextAnswer(question: Question, answerText: string): Promise<number> {
  const rubric =
    question.scoringPrompt ||
    `Score this response 1 (low) to 5 (high) on how well it demonstrates the competency in this AIM assessment question: "${question.text}"`;
  const prompt = `${rubric}\n\nRespondent's answer:\n"""${answerText}"""\n\nRespond with ONLY a JSON object, no other text: {"score": <integer 1-5>, "rationale": "<one short sentence>"}`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set — falling back to neutral midpoint score.");
    return 3;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    const text = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("\n")
      .replace(/```json|```/g, "")
      .trim();
    const parsed = JSON.parse(text);
    const score = Number(parsed.score);
    // Falls back to a neutral midpoint if the call or parse fails, so one
    // bad request never blocks someone's whole submission (PRD §2.2).
    return Number.isFinite(score) ? Math.max(1, Math.min(5, score)) : 3;
  } catch (e) {
    console.error("Text scoring failed, using fallback midpoint", e);
    return 3;
  }
}
