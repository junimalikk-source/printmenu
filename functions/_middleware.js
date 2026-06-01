/**
 * Enforce trailing slashes on all page URLs.
 * Passes through: assets (any path with a file extension), /api/* routes,
 * and URLs that already end with /.
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const { pathname } = url;

  // Already ends with slash, is an API route, or is a file (has extension) — pass through
  if (
    pathname.endsWith('/') ||
    pathname.startsWith('/api/') ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return context.next();
  }

  // Redirect to trailing-slash version
  url.pathname = pathname + '/';
  return Response.redirect(url.toString(), 301);
}
