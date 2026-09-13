/**
 * Production-grade HTML Sanitizer for external API descriptions and user text.
 * Eliminates Cross-Site Scripting (XSS) vectors by stripping:
 * - <script>, <iframe>, <object>, <embed>, <style>, <link>
 * - Event handlers: onload, onerror, onclick, onmouseover, etc.
 * - Pseudo-protocols: javascript:, data:, vbscript:
 * - Non-whitelisted tags and attributes
 */
export function sanitizeHtml(html: string | undefined | null): string {
  if (!html || typeof html !== "string") return "";

  // 1. Remove high-risk executable elements entirely (including contents)
  let clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<link\b[^>]*>/gi, "");

  // 2. Remove all inline event handlers (e.g. onerror=, onclick=, onload=)
  clean = clean.replace(/\s*on[a-z]+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, "");

  // 3. Remove dangerous protocols (javascript:, data:, vbscript:)
  clean = clean.replace(/\s*(?:href|src|action|formaction)\s*=\s*(['"]?)\s*(?:javascript|data|vbscript):[^\s>]*\1/gi, "");

  // 4. Whitelist only safe semantic formatting tags (strip any non-whitelisted tags)
  const allowedTags = new Set(["p", "br", "b", "i", "em", "strong", "span", "ul", "ol", "li"]);

  clean = clean.replace(/<\/?([a-z0-9]+)(?:\s+[^>]*)?>/gi, (match, tagName) => {
    const lower = tagName.toLowerCase();
    if (!allowedTags.has(lower)) {
      return "";
    }
    const isClosing = match.startsWith("</");
    return isClosing ? `</${lower}>` : `<${lower}>`;
  });

  return clean.trim();
}
