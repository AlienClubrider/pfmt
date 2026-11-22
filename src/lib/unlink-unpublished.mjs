// For the public build: a link from a published page to a post that isn't out yet would 404,
// so it becomes plain text (the words stay, the link goes). Works on built HTML; pure, so unit tested.

/** True when href points at one of the slugs, e.g. "../some-slug/#part". */
export const linksTo = (href, slugs) => slugs.some(s => new RegExp(`(^|/)${s}(/|#|$)`).test(href));

/** The html with every <a> that points at an unpublished slug turned into a <span>. */
export function unlinkUnpublished(html, slugs) {
  if (!slugs.length) return html;
  return html.replace(/<a\b([^>]*?)\bhref="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/g, (whole, _pre, href, _post, inner) =>
    linksTo(href, slugs) ? `<span>${inner}</span>` : whole);
}
