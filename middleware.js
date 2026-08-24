/**
 * Edge Middleware — two agent-facing behaviours that Vercel's static layer
 * cannot express on its own.
 *
 * Why middleware and not `rewrites` in vercel.json: Vercel checks the
 * filesystem BEFORE applying rewrites, so "/" always resolves to index.html and
 * a `has`-Accept rewrite never runs. Middleware runs before the filesystem
 * check, so it is the only place either of these can be decided.
 *
 *  1. acceptmarkdown.com content negotiation — `Accept: text/markdown` on "/"
 *     is served /index.md. Browsers never send that header, so HTML delivery is
 *     untouched. The matching `Vary: Accept` also lives in vercel.json.
 *
 *  2. Agent-friendly 404s (is-agentic `agent-friendly-404`). A 23KB HTML error
 *     page tells an agent nothing it can act on. Clients that did NOT ask for
 *     HTML — curl, fetch(), crawlers — get the same 404 status with the short
 *     markdown recovery body from 404.md instead. Anything sending
 *     `Accept: text/html` (i.e. every real browser) still gets 404.html.
 *
 * KNOWN_PATHS / NOT_FOUND_MD are generated: `npm run gen-middleware-data`.
 * That generator fails if a sitemap URL is missing from the list, so a real
 * page can never be answered here as a 404.
 */
import { KNOWN_PATHS, NOT_FOUND_MD } from './middleware-data.js';

export const config = {
  // Page-like requests only. Assets and API routes never reach this.
  matcher: ['/((?!_vercel|api/|css/|js/|lib/|images/|fonts/).*)'],
};

const AGENT_UA =
  /bot\b|crawler|spider|gptbot|claude|anthropic|perplexity|openai|curl|wget|python-requests|httpx|node-fetch|axios|go-http-client|is-?agentic|ora\.ai/i;

/** Only paths that could plausibly be a page — never assets. */
function isPageLike(pathname) {
  const last = pathname.split('/').pop() || '';
  return !last.includes('.') || /\.(html|md)$/i.test(last);
}

function isKnown(pathname) {
  if (KNOWN_PATHS.has(pathname)) return true;
  try {
    if (KNOWN_PATHS.has(decodeURIComponent(pathname))) return true;
  } catch {
    /* malformed escape — treat as unknown */
  }
  return false;
}

export default function middleware(request) {
  const accept = (request.headers.get('accept') || '').toLowerCase();
  const ua = request.headers.get('user-agent') || '';
  const { pathname } = new URL(request.url);

  if (pathname === '/' && accept.includes('text/markdown')) {
    return new Response(null, {
      headers: {
        'x-middleware-rewrite': new URL('/index.md', request.url).toString(),
        'Content-Type': 'text/markdown; charset=utf-8',
        Vary: 'Accept, Accept-Encoding',
      },
    });
  }

  const wantsHtml = accept.includes('text/html');
  if (isPageLike(pathname) && !isKnown(pathname) && (!wantsHtml || AGENT_UA.test(ua))) {
    return new Response(NOT_FOUND_MD, {
      status: 404,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate',
        Vary: 'Accept, User-Agent',
        Link: '<https://eliavafar.co.il/sitemap.xml>; rel="sitemap", <https://eliavafar.co.il/llms.txt>; rel="alternate"; type="text/plain"',
      },
    });
  }

  return; // ordinary request — fall through to the filesystem
}
