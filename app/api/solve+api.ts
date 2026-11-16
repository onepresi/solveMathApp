import { solveMathImage, SolverError } from '@/server/math-solver';
import type { SolveErrorBody, SolveRequestBody } from '@/types/solution';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BASE64_LENGTH = 12 * 1024 * 1024; // ~9 MB of image data

function error(message: string, status: number) {
  return Response.json({ error: message } satisfies SolveErrorBody, { status });
}

/** POST /api/solve  { imageBase64, mimeType } → SolveResult */
export async function POST(request: Request) {
  let body: Partial<SolveRequestBody>;
  try {
    body = await request.json();
  } catch {
    return error('Request body must be JSON.', 400);
  }

  const { imageBase64, mimeType } = body;
  if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
    return error('Missing image.', 400);
  }
  if (imageBase64.length > MAX_BASE64_LENGTH) {
    return error('Image is too large. Please use a smaller photo.', 413);
  }
  if (typeof mimeType !== 'string' || !ALLOWED_TYPES.has(mimeType)) {
    return error('Unsupported image type. Use JPEG, PNG, or WEBP.', 415);
  }

  try {
    const result = await solveMathImage(imageBase64, mimeType);
    return Response.json(result);
  } catch (e) {
    if (e instanceof SolverError) return error(e.message, e.status);
    if (e instanceof Error && e.name === 'TimeoutError') {
      return error('Solving took too long. Please try again.', 504);
    }
    console.error('[solve] unexpected error', e);
    return error('Something went wrong while solving. Please try again.', 500);
  }
}
