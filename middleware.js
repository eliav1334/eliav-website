/**
 * Edge Middleware — acceptmarkdown.com content negotiation.
 *
 * Why middleware and not a `rewrites` rule in vercel.json: Vercel checks the
 * filesystem BEFORE applying rewrites, so "/" always resolves to index.html and
 * the rewrite never runs. Middleware runs before the filesystem check, so it is
 * the only place this can be decided.
 *
 * Browsers never send `Accept: text/markdown`, so HTML delivery is untouched.
 * The matching `Vary: Accept` header lives in vercel.json — without it a CDN can
 * hand the cached HTML variant to an agent that asked for markdown.
 */

export const config = {
  matcher: ['/'],
};

export default function middleware(request) {
  const accept = request.headers.get('accept') || '';

  if (!accept.toLowerCase().includes('text/markdown')) {
    return; // ordinary request — fall through to index.html
  }

  const url = new URL('/index.md', request.url);
  return new Response(null, {
    headers: {
      'x-middleware-rewrite': url.toString(),
      'Content-Type': 'text/markdown; charset=utf-8',
      Vary: 'Accept, Accept-Encoding',
    },
  });
}
