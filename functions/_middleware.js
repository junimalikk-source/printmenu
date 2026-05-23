export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === 'www.printmenu.co.uk') {
    url.hostname = 'printmenu.co.uk';
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
