/**
 * Shapes shared between the client and the /api/solve route.
 * Keep this file free of secrets and server-only imports.
 */

export const SOLUTION_TOPICS = [
  'algebra',
  'geometry',
  'calculus',
  'trigonometry',
  'statistics',
  'arithmetic',
  'other',
] as const;

export type SolutionTopic = (typeof SOLUTION_TOPICS)[number];

export type SolutionStep = {
  title: string;
  explanation: string;
  /** Math worked in this step, one expression per line. May be empty. */
  work: string;
};

export type SolvedProblem = {
  question: string;
  topic: SolutionTopic;
  difficulty: 'easy' | 'medium' | 'hard';
  finalAnswer: string;
  approach: string;
  givens: string[];
  steps: SolutionStep[];
  verification: string;
  keyConcepts: string[];
  commonMistakes: string[];
};

export type SolveResult = {
  status: 'solved' | 'no_math_found' | 'unreadable';
  /** Short note for the student: assumptions made or why nothing was solved. */
  message: string | null;
  problems: SolvedProblem[];
};

export type SolveRequestBody = {
  /** Raw base64 (no data: prefix). */
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
};

export type SolveErrorBody = { error: string };
