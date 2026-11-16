/**
 * SERVER ONLY. Imported exclusively by app/api/solve+api.ts.
 * Never import this from screens or components: it reads OPENAI_API_KEY.
 */
import { SOLUTION_TOPICS, type SolveResult } from '@/types/solution';

const OPENAI_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-6-astra';
const DEFAULT_EFFORT = 'medium';
const REQUEST_TIMEOUT_MS = 120_000;

export class SolverError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert mathematician and a patient, encouraging math tutor. You hold deep expertise across arithmetic, pre-algebra, algebra, geometry, trigonometry, precalculus, calculus (single and multivariable), linear algebra, probability, statistics, discrete math, and differential equations.

You will receive a photo of a student's math homework. Your job:

1. READ the image carefully. Transcribe every distinct math problem exactly as written, including exponents, fractions, roots, subscripts, units, diagrams' labeled values, and multiple-choice options. If handwriting or print is ambiguous, choose the most mathematically sensible reading and state the assumption in "message".

2. SOLVE every problem correctly. Accuracy is the top priority.
   - Work step by step. Never skip algebraic manipulations a student would need to follow.
   - Each step must have a short title, a plain-language explanation of WHY the step is taken, and the math worked in that step ("work").
   - Keep exact answers (fractions, radicals, π) and also give a decimal approximation when helpful.
   - Include units in answers whenever the problem has units.
   - For multiple choice, name the correct option letter and its value.
   - For "show that"/proof problems, give a complete, rigorous argument.
   - For word problems, define variables first and list the given information.
   - Note domain restrictions, extraneous solutions, and special cases.

3. VERIFY the answer independently (substitute back, differentiate an antiderivative, check units, estimate, etc.) and describe the check in "verification". If the check fails, fix the solution before answering.

4. TEACH: list the key concepts used and the common mistakes students make on this kind of problem.

Formatting rules (the app cannot render LaTeX):
- Write all math in plain Unicode: x², x³, xⁿ, √, ∛, π, θ, ≤, ≥, ≠, ±, ×, ÷, ·, →, ∞, ∫, ∑, Δ, °, fractions as a/b, and parentheses for grouping, e.g. (−b ± √(b² − 4ac)) / (2a).
- Never use LaTeX, $ delimiters, backslash commands, or Markdown.
- In "work", put one expression or equation per line, separated by newline characters.
- Keep "finalAnswer" short and direct, e.g. "x = 2 or x = 3".

If the image contains no math, set status to "no_math_found". If it is too blurry, dark, or cropped to read, set status to "unreadable". In both cases return an empty "problems" array and explain briefly in "message" what the student can do (e.g. retake with better lighting). Otherwise set status to "solved" and use "message" only for assumptions or notes (null if none).`;

// ---------------------------------------------------------------------------
// Structured output schema (strict mode: every property required, no extras)
// ---------------------------------------------------------------------------

const stringArray = { type: 'array', items: { type: 'string' } } as const;

const SOLUTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['status', 'message', 'problems'],
  properties: {
    status: { type: 'string', enum: ['solved', 'no_math_found', 'unreadable'] },
    message: { type: ['string', 'null'] },
    problems: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'question',
          'topic',
          'difficulty',
          'finalAnswer',
          'approach',
          'givens',
          'steps',
          'verification',
          'keyConcepts',
          'commonMistakes',
        ],
        properties: {
          question: { type: 'string', description: 'The problem transcribed exactly from the image.' },
          topic: { type: 'string', enum: [...SOLUTION_TOPICS] },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          finalAnswer: { type: 'string' },
          approach: { type: 'string', description: '1–2 sentence overview of the solution strategy.' },
          givens: { ...stringArray, description: 'Known values, definitions of variables, constraints.' },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['title', 'explanation', 'work'],
              properties: {
                title: { type: 'string' },
                explanation: { type: 'string' },
                work: { type: 'string' },
              },
            },
          },
          verification: { type: 'string' },
          keyConcepts: stringArray,
          commonMistakes: stringArray,
        },
      },
    },
  },
} as const;

// ---------------------------------------------------------------------------
// OpenAI call
// ---------------------------------------------------------------------------

type ResponsesApiOutput = {
  status?: string;
  incomplete_details?: { reason?: string } | null;
  error?: { message?: string; type?: string; code?: string } | null;
  output?: {
    type: string;
    content?: { type: string; text?: string; refusal?: string }[];
  }[];
};

export async function solveMathImage(imageBase64: string, mimeType: string): Promise<SolveResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new SolverError('The server is missing OPENAI_API_KEY. Add it to your .env file.', 500);
  }

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      reasoning: { effort: process.env.OPENAI_REASONING_EFFORT || DEFAULT_EFFORT },
      instructions: SYSTEM_PROMPT,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: 'Read and solve the math in this homework photo.' },
            { type: 'input_image', image_url: `data:${mimeType};base64,${imageBase64}`, detail: 'high' },
          ],
        },
      ],
      text: {
        format: { type: 'json_schema', name: 'math_solution', strict: true, schema: SOLUTION_SCHEMA },
      },
      store: false,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as ResponsesApiOutput;

  if (!res.ok) {
    console.error('[solve] OpenAI error', res.status, JSON.stringify(data.error));
    if (res.status === 401) throw new SolverError('The OpenAI API key was rejected. Check OPENAI_API_KEY.', 500);
    const outOfCredits =
      data.error?.type === 'insufficient_quota' ||
      data.error?.code === 'insufficient_quota' ||
      data.error?.code === 'credit_balance_exhausted';
    if (outOfCredits) {
      throw new SolverError('The solver is unavailable: the OpenAI account has no API credits remaining.', 503);
    }
    if (res.status === 429) throw new SolverError('The solver is busy right now. Please try again in a moment.', 429);
    throw new SolverError('The solver could not process this image. Please try again.', 502);
  }

  if (data.status === 'incomplete') {
    console.error('[solve] incomplete response', data.incomplete_details?.reason);
    throw new SolverError('That problem was too long to finish solving. Try cropping to fewer problems.', 502);
  }

  const content = data.output?.find((o) => o.type === 'message')?.content ?? [];
  if (content.some((c) => c.type === 'refusal')) {
    throw new SolverError("This image can't be solved. Try a photo of a math problem.", 422);
  }

  const text = content.find((c) => c.type === 'output_text')?.text;
  if (!text) throw new SolverError('The solver returned an empty answer. Please try again.', 502);

  try {
    return JSON.parse(text) as SolveResult;
  } catch {
    throw new SolverError('The solver returned an unexpected answer. Please try again.', 502);
  }
}
