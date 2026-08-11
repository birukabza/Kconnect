// Lightweight English/Kinyarwanda language detector for the "conversation
// mode" flow: instead of requiring either side to pick a direction before
// every message, we guess it from what was actually typed.
//
// Why not a library? Generic language-ID tools (langdetect, franc's default
// build, etc.) either don't cover Kinyarwanda at all or need ~50+ characters
// of text to be reliable — too slow/uncertain for short chat-style messages.
// Since we only ever need to tell apart exactly TWO known languages (not
// classify against hundreds), a small stopword list beats a generic model:
// Kinyarwanda has short, high-frequency function words that essentially
// never appear in English text, so even a one-word message like "Muraho"
// or "Hello" resolves with high confidence.
//
// Returns null when the text doesn't lean clearly either way (e.g. numbers,
// proper nouns only, or genuinely mixed input) — callers should fall back to
// the last known conversation direction rather than guessing blindly.

const EN_STOPWORDS = new Set([
  "i", "you", "he", "she", "we", "they", "it", "is", "are", "am", "was", "were",
  "the", "a", "an", "to", "of", "in", "on", "at", "for", "with", "and", "or",
  "but", "not", "my", "your", "his", "her", "our", "their", "this", "that",
  "hello", "hi", "hey", "please", "thanks", "thank", "yes", "no", "how",
  "what", "where", "when", "why", "who", "can", "could", "will", "would",
  "want", "need", "help", "school", "name", "good", "morning", "money",
  "much", "far", "here", "there", "left", "right", "doctor", "police", "lost",
]);

const RW_STOPWORDS = new Set([
  "muraho", "mwaramutse", "amakuru", "murakoze", "murabeho", "witwa", "nitwa",
  "ni", "na", "cyane", "gute", "he", "iyi", "iyo", "uyu", "uwo", "aderesi",
  "ibumoso", "iburyo", "rimwe", "kabiri", "icumi", "ijana", "nyabuneka",
  "nkeneye", "muganga", "polisi", "nabuze", "inzira", "ibyihutirwa",
  "ndashaka", "ndabifata", "ufite", "njya", "njyana", "kuraba", "gusa",
  "angahe", "wagabanya", "igiciro", "ibiciro", "ubwiherero", "buri", "kure",
  "hano", "kuri", "kandi", "cyangwa", "ariko", "nka", "kuko", "niba",
  "noneho", "ubu", "aha", "ese", "yego", "oya", "sha", "mfashe", "muri",
  "kwiga", "nde",
]);

// Digraphs/trigraphs common in Kinyarwanda spelling and rare in English —
// used only as a tiebreaker when no stopword matched at all.
const RW_DISTINCTIVE_PATTERNS = [/ny/, /cy/, /rw/, /bw/, /shy/, /mw/, /nz/, /gw/, /nk/];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\s']/gu, "")
    .split(/\s+/)
    .filter(Boolean);
}

export function detectLanguage(text: string): "en" | "rw" | null {
  const tokens = tokenize(text);
  if (tokens.length === 0) return null;

  let enScore = 0;
  let rwScore = 0;
  for (const token of tokens) {
    if (EN_STOPWORDS.has(token)) enScore += 2;
    if (RW_STOPWORDS.has(token)) rwScore += 2;
  }

  if (enScore === 0 && rwScore === 0) {
    for (const token of tokens) {
      if (RW_DISTINCTIVE_PATTERNS.some((pattern) => pattern.test(token))) rwScore += 1;
    }
  }

  if (enScore === rwScore) return null; // includes the 0-0 case: genuinely ambiguous
  return enScore > rwScore ? "en" : "rw";
}
