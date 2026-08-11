import { Phrase } from "./types";

// Static quick-phrase data set — structured as data (not hardcoded JSX) so it's
// trivial to move to a Supabase table later if the list needs to grow or be
// community-sourced. Also doubles as the lookup table the mock pipeline uses
// to return real translations for known phrases.
export const PHRASE_CATEGORIES = [
  "Greetings",
  "Market & Bargaining",
  "Directions",
  "Numbers & Money",
  "Emergency",
] as const;

export type PhraseCategory = (typeof PHRASE_CATEGORIES)[number];

export const PHRASES: Phrase[] = [
  // Greetings
  { id: "greet-1", category: "Greetings", en: "Hello", rw: "Muraho" },
  { id: "greet-2", category: "Greetings", en: "Good morning", rw: "Mwaramutse" },
  { id: "greet-3", category: "Greetings", en: "How are you?", rw: "Amakuru?" },
  { id: "greet-4", category: "Greetings", en: "I am fine, thank you", rw: "Ni meza, murakoze" },
  { id: "greet-5", category: "Greetings", en: "Thank you very much", rw: "Murakoze cyane" },
  { id: "greet-6", category: "Greetings", en: "Goodbye", rw: "Murabeho" },
  { id: "greet-7", category: "Greetings", en: "What is your name?", rw: "Witwa nde?" },
  { id: "greet-8", category: "Greetings", en: "My name is...", rw: "Nitwa..." },

  // Market & Bargaining
  { id: "market-1", category: "Market & Bargaining", en: "How much is this?", rw: "Iki ni angahe?" },
  { id: "market-2", category: "Market & Bargaining", en: "That is too expensive", rw: "Ni ibiciro cyane" },
  { id: "market-3", category: "Market & Bargaining", en: "Can you lower the price?", rw: "Wagabanya igiciro?" },
  { id: "market-4", category: "Market & Bargaining", en: "I will take it", rw: "Ndabifata" },
  { id: "market-5", category: "Market & Bargaining", en: "Do you have change?", rw: "Ufite ibisigazwa?" },
  { id: "market-6", category: "Market & Bargaining", en: "I am just looking", rw: "Ndi kuraba gusa" },

  // Directions
  { id: "dir-1", category: "Directions", en: "Where is the bathroom?", rw: "Ubwiherero buri he?" },
  { id: "dir-2", category: "Directions", en: "How do I get to the city center?", rw: "Njya gute mu mujyi rwagati?" },
  { id: "dir-3", category: "Directions", en: "Is it far from here?", rw: "Ni kure hano?" },
  { id: "dir-4", category: "Directions", en: "Please take me to this address", rw: "Nyabuneka njyana kuri iyi aderesi" },
  { id: "dir-5", category: "Directions", en: "Turn left", rw: "Hindukira ibumoso" },
  { id: "dir-6", category: "Directions", en: "Turn right", rw: "Hindukira iburyo" },
  { id: "dir-7", category: "Directions", en: "You pass up there", rw: "Uranyura hariya haruguru" },

  // Numbers & Money
  { id: "num-1", category: "Numbers & Money", en: "One", rw: "Rimwe" },
  { id: "num-2", category: "Numbers & Money", en: "Two", rw: "Kabiri" },
  { id: "num-3", category: "Numbers & Money", en: "Ten", rw: "Icumi" },
  { id: "num-4", category: "Numbers & Money", en: "One hundred", rw: "Ijana" },
  { id: "num-5", category: "Numbers & Money", en: "Where can I exchange money?", rw: "Ni he nahindurira amafaranga?" },

  // Emergency
  { id: "emg-1", category: "Emergency", en: "Help me, please", rw: "Mfashe, nyabuneka" },
  { id: "emg-2", category: "Emergency", en: "I need a doctor", rw: "Nkeneye muganga" },
  { id: "emg-3", category: "Emergency", en: "Call the police", rw: "Hamagara polisi" },
  { id: "emg-4", category: "Emergency", en: "I am lost", rw: "Nabuze inzira" },
  { id: "emg-5", category: "Emergency", en: "This is an emergency", rw: "Ibi ni ibyihutirwa" },
];

export function findPhraseTranslation(text: string, direction: "en-to-rw" | "rw-to-en"): string | null {
  const normalized = text.trim().toLowerCase();
  const match = PHRASES.find((p) =>
    direction === "en-to-rw" ? p.en.toLowerCase() === normalized : p.rw.toLowerCase() === normalized
  );
  if (!match) return null;
  return direction === "en-to-rw" ? match.rw : match.en;
}
