/**
 * Vercel Edge Middleware
 * Runs on Vercel Global Edge CDN (< 0.1ms execution time)
 * Intercepts and blocks unauthorized / malicious requests BEFORE invoking the heavier Serverless function.
 */
export function middleware(request) {
  const url = new URL(request.url);
  const secret = process.env.AUTH_SECRET;

  // If AUTH_SECRET is configured in Vercel Environment Variables, enforce authentication
  if (secret && secret.length > 0 && url.pathname.startsWith('/api/transform')) {
    const token = url.searchParams.get('token') || url.searchParams.get('key') || request.headers.get('x-auth-token');
    
    // Check Authorization header (Bearer token)
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

    if (token !== secret && bearerToken !== secret) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized',
        message: 'This image transformer instance is private. Please provide a valid ?token= or deploy your own free instance from https://github.com/cyhcyhgo/epaper-image-service'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
        }
      });
    }
  }
}

export const config = {
  matcher: ['/api/transform', '/api/transform/:path*']
};
