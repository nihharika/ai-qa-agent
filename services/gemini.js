import { GoogleGenAI, Type } from "@google/genai";

function extractJson(text) {
  const raw = String(text || "").trim();

  const withoutFences = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFences);
  } catch {
    const start = withoutFences.indexOf("{");
    const end = withoutFences.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Gemini did not return valid JSON.");
    }

    return JSON.parse(withoutFences.slice(start, end + 1));
  }
}

export async function generateScenarios({ formContract, count = 10 }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY. Add it to your .env file before running AI tests."
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const fieldProperties = {
    name: { type: Type.STRING },
    email: { type: Type.STRING },
    phone: { type: Type.STRING },
    city: { type: Type.STRING },
    message: { type: Type.STRING }
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      scenarios: {
        type: Type.ARRAY,
        minItems: count,
        maxItems: count,
        items: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING
            },
            expected: {
              type: Type.STRING,
              enum: ["success", "validation-error"]
            },
            data: {
              type: Type.OBJECT,
              properties: fieldProperties,
              required: ["name", "email", "phone", "city", "message"],
              propertyOrdering: ["name", "email", "phone", "city", "message"]
            },
            reason: {
              type: Type.STRING
            }
          },
          required: ["title", "expected", "data", "reason"],
          propertyOrdering: ["title", "expected", "data", "reason"]
        }
      }
    },
    required: ["scenarios"],
    propertyOrdering: ["scenarios"]
  };

  const prompt = `
You are a senior QA automation engineer.

Generate exactly ${count} test scenarios for this form.

Form contract:
${JSON.stringify(formContract, null, 2)}

Requirements:
1. Include valid happy path.
2. Include empty required fields.
3. Include invalid email.
4. Include invalid phone.
5. Include lowercase name.
6. Include city with numbers.
7. Include short message.
8. Include SQL injection attempt in message.
9. Include script injection attempt in message.
10. Include edge-valid values.

Important:
- Do not generate Playwright code.
- Do not include markdown.
- Do not wrap JSON in triple backticks.
- Return only JSON matching the schema.
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema
    }
  });

  const text =
    typeof response.text === "function" ? response.text() : response.text;

  return extractJson(text);
}