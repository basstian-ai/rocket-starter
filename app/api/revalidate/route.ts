import { revalidate } from 'lib/bff';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API route handler for processing on-demand revalidation requests.
 * It receives a POST request, typically triggered by a webhook or a manual action
 * from a CMS or other data source, and delegates the actual revalidation logic
 * (like revalidating specific paths or tags) to the `revalidate` function
 * imported from the BFF layer (`lib/bff`).
 * @param {NextRequest} req The incoming Next.js request object, which may contain
 * details about what to revalidate (e.g., in its body or headers).
 * @returns {Promise<NextResponse>} A response indicating the outcome of the
 * revalidation attempt, as returned by the BFF's `revalidate` function.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return revalidate(req);
}
