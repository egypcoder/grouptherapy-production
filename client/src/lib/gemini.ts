const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export const isGeminiConfigured = () => !!GEMINI_API_KEY;

export async function generateContent(prompt: string): Promise<string> {
  if (!isGeminiConfigured()) {
    return "Error: Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your environment variables.";
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData?.error?.message ||
        `API request failed with status ${response.status}`;
      return `Error: ${errorMessage}`;
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      return "Error: No response generated from Gemini.";
    }

    const candidate = data.candidates[0];
    if (!candidate.content?.parts?.[0]?.text) {
      return "Error: Invalid response format from Gemini.";
    }

    return candidate.content.parts[0].text;
  } catch (error) {
    console.error("Gemini API error:", error);
    return `Error: ${error instanceof Error ? error.message : "Failed to generate content"}`;
  }
}
