export interface ClassificationResult {
  label: "spam" | "ham";
  confidence: number;
  spamProbability: number;
  tokens: TokenScore[];
  topContributors: TokenScore[];
}

export interface TokenScore {
  token: string;
  score: number;
  type: "spam" | "ham" | "neutral";
}

const SPAM_TOKENS = new Set([
  "free",
  "win",
  "winner",
  "prize",
  "claim",
  "cash",
  "money",
  "urgent",
  "offer",
  "limited",
  "click",
  "reply",
  "call",
  "txt",
  "text",
  "mobile",
  "ringtone",
  "xxx",
  "adult",
  "guaranteed",
  "award",
  "selected",
  "congratulations",
  "won",
  "bonus",
  "\u00a3",
  "$",
]);

const HAM_TOKENS = new Set([
  "meeting",
  "tomorrow",
  "dinner",
  "home",
  "ok",
  "sure",
  "thanks",
  "see",
  "you",
  "going",
  "later",
  "help",
  "work",
  "class",
  "lunch",
  "pick",
  "love",
  "miss",
  "good",
  "morning",
]);

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "as",
  "is",
  "was",
  "are",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "shall",
  "can",
  "need",
  "dare",
  "ought",
  "i",
  "me",
  "my",
  "we",
  "our",
  "us",
  "it",
  "its",
  "they",
  "them",
  "their",
  "this",
  "that",
  "these",
  "those",
  "not",
  "no",
  "nor",
  "if",
  "then",
  "because",
  "while",
  "although",
  "though",
  "since",
  "about",
  "from",
  "by",
  "into",
  "through",
  "during",
  "up",
  "down",
  "out",
  "over",
  "after",
  "before",
  "between",
  "each",
  "every",
  "all",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "only",
  "just",
  "than",
  "too",
  "very",
  "so",
  "what",
  "which",
  "who",
  "whom",
  "when",
  "where",
  "why",
  "how",
  "any",
]);

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function tokenize(message: string): string[] {
  return message
    .toLowerCase()
    .split(/[\s.,!?;:()[\]{}"'\-_/\\]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export function classify(message: string): ClassificationResult {
  const tokens = tokenize(message);
  const SPAM_PRIOR = -0.7;

  const tokenScores: TokenScore[] = tokens.map((token) => {
    if (SPAM_TOKENS.has(token)) {
      return { token, score: 0.8, type: "spam" as const };
    }
    if (HAM_TOKENS.has(token)) {
      return { token, score: -0.8, type: "ham" as const };
    }
    return { token, score: 0, type: "neutral" as const };
  });

  const totalScore = tokenScores.reduce((sum, t) => sum + t.score, SPAM_PRIOR);
  const spamProbability = sigmoid(totalScore * 1.5);
  const label = spamProbability > 0.5 ? "spam" : "ham";
  const confidence = label === "spam" ? spamProbability : 1 - spamProbability;

  const topContributors = [...tokenScores]
    .filter((t) => t.type !== "neutral")
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, 8);

  return {
    label,
    confidence,
    spamProbability,
    tokens: tokenScores,
    topContributors,
  };
}
