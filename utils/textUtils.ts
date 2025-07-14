
// A simple HTML entity decoder
const decodingMap: { [key: string]: string } = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};
const decodingRegex = /(&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;)/g;

/**
 * Cleans a message string by removing HTML tags, decoding common HTML entities,
 * and removing UUID-like mentions.
 * @param text The raw text, possibly containing HTML.
 * @returns The cleaned text.
 */
export const cleanMessage = (text: string): string => {
  if (!text) return '';
  // Remove HTML tags
  let cleaned = text.replace(/<[^>]*>/g, ' ');
  // Decode HTML entities
  cleaned = cleaned.replace(decodingRegex, (match) => decodingMap[match]);
  // Remove UUID-like mentions (e.g., @64475d57-...)
  cleaned = cleaned.replace(/@[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}/gi, '');
  // Replace multiple spaces/newlines with a single space
  return cleaned.replace(/\s\s+/g, ' ').trim();
};
