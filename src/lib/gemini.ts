/**
 * Gemini AI API Service for Quiz Generation
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyCVrw_d9drp9ZekZula22s_26N-fJXyxdY";

// Try gemini-1.5-flash first, fallback to gemini-pro if it fails
const getGeminiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // 0-based index
  explanation: string;
}

export interface QuizData {
  questions: QuizQuestion[];
  subject: string;
  topics: string[];
  generatedAt: string;
}

/**
 * Generate a short summary for a subject based on the user's aim.
 */
export async function generateSubjectSummary(
  subjectName: string,
  aim: string
): Promise<string> {
   if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured");
  }

  const prompt = `Provide a concise 3-sentence summary of the subject "${subjectName}" tailored for a student aiming for "${aim}" performance. Include 1 key tip for success.`;

    const models = ["gemini-1.5-flash", "gemini-pro"];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const response = await fetch(getGeminiUrl(model), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 256,
          },
        }),
      });

      if (!response.ok) {
         if (response.status === 404 || response.status === 400) {
          lastError = new Error(`Gemini API error: ${response.status} ${response.statusText}`);
          continue; 
        }
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
       if (!textContent) {
        throw new Error("No content received from Gemini API");
      }
      return textContent.trim();

    } catch (error) {
       if (model === models[models.length - 1]) {
           console.error("Error generating summary with all models:", error);
           throw lastError || error;
       }
       lastError = error instanceof Error ? error : new Error(String(error));
       continue;
    }
  }
  return "Unable to generate summary at this time.";
}

/**
 * Generate quiz questions using Gemini AI
 */
export async function generateQuiz(
  subjectName: string,
  topics: string[]
): Promise<QuizData> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured");
  }

  const topicsList = topics.length > 0
    ? topics.join(", ")
    : "general concepts from this subject";

  const prompt = `Generate 10 multiple-choice questions (MCQ) for the subject "${subjectName}" covering the following topics: ${topicsList}.

Requirements:
1. Each question should have exactly 4 options (A, B, C, D)
2. Only one option should be correct
3. Include a brief explanation for the correct answer
4. Questions should be at an undergraduate level (3rd year engineering)
5. Mix difficulty levels (some easy, some medium, some challenging)

Return the response in the following JSON format (no markdown, just pure JSON):
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this answer is correct"
    }
  ]
}

Make sure the JSON is valid and can be parsed directly.`;

  // Try gemini-1.5-flash first, fallback to gemini-pro
  const models = ["gemini-1.5-flash", "gemini-pro"];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const response = await fetch(getGeminiUrl(model), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Gemini API Error (${model}):`, errorData);

        // If it's a 404 or 400, try next model
        if (response.status === 404 || response.status === 400) {
          lastError = new Error(`Gemini API error: ${response.status} ${response.statusText}`);
          continue; // Try next model
        }

        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Extract text from Gemini response
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textContent) {
        throw new Error("No content received from Gemini API");
      }

      // Clean the response - remove markdown code blocks if present
      let cleanedText = textContent.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      // Parse JSON
      const quizJson = JSON.parse(cleanedText);

      // Validate structure
      if (!quizJson.questions || !Array.isArray(quizJson.questions)) {
        throw new Error("Invalid quiz format from Gemini API");
      }

      // Ensure all questions have required fields
      const validatedQuestions: QuizQuestion[] = quizJson.questions.map((q: any, index: number) => {
        if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error(`Invalid question format at index ${index}`);
        }
        if (typeof q.correctAnswer !== "number" || q.correctAnswer < 0 || q.correctAnswer > 3) {
          throw new Error(`Invalid correctAnswer at index ${index}`);
        }
        return {
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "No explanation provided",
        };
      });

      return {
        questions: validatedQuestions,
        subject: subjectName,
        topics,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      // If this is the last model, throw the error
      if (model === models[models.length - 1]) {
        console.error("Error generating quiz with all models:", error);
        if (error instanceof SyntaxError) {
          throw new Error("Failed to parse quiz response from AI. Please try again.");
        }
        throw lastError || error;
      }
      // Otherwise, continue to next model
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }

  // If we get here, all models failed
  throw lastError || new Error("Failed to generate quiz with all available models");
}

