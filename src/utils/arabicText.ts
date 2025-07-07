/**
 * Arabic text processing utilities for Quranic text analysis
 * Based on BacaAlquran approach with enhancements for DTW/HMM analysis
 */

// Arabic diacritics and special characters
const ARABIC_DIACRITICS = [
  '\u064B', // Fathatan
  '\u064C', // Dammatan  
  '\u064D', // Kasratan
  '\u064E', // Fatha
  '\u064F', // Damma
  '\u0650', // Kasra
  '\u0651', // Shadda
  '\u0652', // Sukun
  '\u0653', // Maddah
  '\u0654', // Hamza Above
  '\u0655', // Hamza Below
  '\u0656', // Subscript Alef
  '\u0657', // Inverted Damma
  '\u0658', // Mark Noon Ghunna
  '\u0659', // Zwarakay
  '\u065A', // Vowel Sign Small V Above
  '\u065B', // Vowel Sign Inverted Small V Above
  '\u065C', // Vowel Sign Dot Below
  '\u065D', // Reversed Damma
  '\u065E', // Fatha With Two Dots
  '\u065F', // Wavy Hamza Below
  '\u0670', // Superscript Alef
];

const ARABIC_LETTERS = [
  '\u0627', // Alef
  '\u0628', // Beh
  '\u062A', // Teh
  '\u062B', // Theh
  '\u062C', // Jeem
  '\u062D', // Hah
  '\u062E', // Khah
  '\u062F', // Dal
  '\u0630', // Thal
  '\u0631', // Reh
  '\u0632', // Zain
  '\u0633', // Seen
  '\u0634', // Sheen
  '\u0635', // Sad
  '\u0636', // Dad
  '\u0637', // Tah
  '\u0638', // Zah
  '\u0639', // Ain
  '\u063A', // Ghain
  '\u0641', // Feh
  '\u0642', // Qaf
  '\u0643', // Kaf
  '\u0644', // Lam
  '\u0645', // Meem
  '\u0646', // Noon
  '\u0647', // Heh
  '\u0648', // Waw
  '\u064A', // Yeh
];

// Letter variations and normalizations
const LETTER_NORMALIZATIONS: Record<string, string> = {
  '\u0622': '\u0627', // Alef with Madda Above → Alef
  '\u0623': '\u0627', // Alef with Hamza Above → Alef
  '\u0625': '\u0627', // Alef with Hamza Below → Alef
  '\u0671': '\u0627', // Alef Wasla → Alef
  '\u0629': '\u0647', // Teh Marbuta → Heh
  '\u0649': '\u064A', // Alef Maksura → Yeh
  '\u06CC': '\u064A', // Farsi Yeh → Yeh
  '\u06A9': '\u0643', // Keheh → Kaf
  '\u06AF': '\u0643', // Gaf → Kaf (for some dialects)
};

/**
 * Removes Arabic diacritics from text for comparison
 */
export function removeDiacritics(text: string): string {
  let normalized = text;
  ARABIC_DIACRITICS.forEach(diacritic => {
    normalized = normalized.replace(new RegExp(diacritic, 'g'), '');
  });
  return normalized;
}

/**
 * Normalizes Arabic text by removing diacritics and standardizing letter variations
 */
export function normalizeArabicText(text: string): string {
  let normalized = removeDiacritics(text);
  
  // Apply letter normalizations
  Object.entries(LETTER_NORMALIZATIONS).forEach(([from, to]) => {
    normalized = normalized.replace(new RegExp(from, 'g'), to);
  });
  
  // Remove extra whitespace and non-Arabic characters (except spaces and numbers)
  normalized = normalized
    .replace(/[^\u0600-\u06FF\s0-9]/g, '') // Keep only Arabic block, spaces, and numbers
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  return normalized;
}

/**
 * Splits Arabic text into individual words with position tracking
 */
export function splitIntoWords(text: string): Array<{ word: string; position: number; originalWord: string }> {
  const originalWords = text.split(/\s+/);
  const words: Array<{ word: string; position: number; originalWord: string }> = [];
  
  originalWords.forEach((originalWord, index) => {
    if (originalWord.trim()) {
      words.push({
        word: normalizeArabicText(originalWord),
        position: index,
        originalWord: originalWord.trim()
      });
    }
  });
  
  return words;
}

/**
 * Calculates Levenshtein distance between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Calculates similarity score between two Arabic strings (0-100%)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeArabicText(str1);
  const normalized2 = normalizeArabicText(str2);
  
  if (normalized1 === normalized2) return 100;
  if (!normalized1 || !normalized2) return 0;
  
  const maxLength = Math.max(normalized1.length, normalized2.length);
  const distance = levenshteinDistance(normalized1, normalized2);
  
  return Math.max(0, (1 - distance / maxLength) * 100);
}

/**
 * Finds the best matching word within a search window
 */
export function findBestMatch(
  targetWord: string,
  searchWords: string[],
  startIndex: number = 0,
  windowSize: number = 5
): { word: string; index: number; similarity: number } | null {
  const endIndex = Math.min(startIndex + windowSize, searchWords.length);
  let bestMatch: { word: string; index: number; similarity: number } | null = null;
  
  for (let i = startIndex; i < endIndex; i++) {
    const similarity = calculateSimilarity(targetWord, searchWords[i]);
    
    if (!bestMatch || similarity > bestMatch.similarity) {
      bestMatch = {
        word: searchWords[i],
        index: i,
        similarity
      };
    }
  }
  
  return bestMatch;
}

/**
 * Extracts phonemes from Arabic text for DTW analysis
 * This is a simplified implementation - in production, you'd use a proper Arabic phoneme analyzer
 */
export function extractPhonemes(arabicText: string): string[] {
  const normalized = normalizeArabicText(arabicText);
  const phonemes: string[] = [];
  
  // Basic phoneme mapping for common Arabic letters
  const phonemeMap: Record<string, string> = {
    '\u0627': 'a',    // Alef
    '\u0628': 'b',    // Beh
    '\u062A': 't',    // Teh
    '\u062B': 'θ',    // Theh
    '\u062C': 'ʤ',    // Jeem
    '\u062D': 'ħ',    // Hah
    '\u062E': 'x',    // Khah
    '\u062F': 'd',    // Dal
    '\u0630': 'ð',    // Thal
    '\u0631': 'r',    // Reh
    '\u0632': 'z',    // Zain
    '\u0633': 's',    // Seen
    '\u0634': 'ʃ',    // Sheen
    '\u0635': 'sˤ',   // Sad
    '\u0636': 'dˤ',   // Dad
    '\u0637': 'tˤ',   // Tah
    '\u0638': 'ðˤ',   // Zah
    '\u0639': 'ʕ',    // Ain
    '\u063A': 'ɣ',    // Ghain
    '\u0641': 'f',    // Feh
    '\u0642': 'q',    // Qaf
    '\u0643': 'k',    // Kaf
    '\u0644': 'l',    // Lam
    '\u0645': 'm',    // Meem
    '\u0646': 'n',    // Noon
    '\u0647': 'h',    // Heh
    '\u0648': 'w',    // Waw
    '\u064A': 'j',    // Yeh
  };
  
  for (const char of normalized) {
    if (phonemeMap[char]) {
      phonemes.push(phonemeMap[char]);
    }
  }
  
  return phonemes;
}

/**
 * Checks if text contains Arabic characters
 */
export function isArabicText(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
}

/**
 * Gets word boundaries for highlighting during recitation
 */
export function getWordBoundaries(text: string): Array<{ start: number; end: number; word: string }> {
  const words = text.split(/\s+/);
  const boundaries: Array<{ start: number; end: number; word: string }> = [];
  let currentPosition = 0;
  
  words.forEach(word => {
    if (word.trim()) {
      const start = text.indexOf(word, currentPosition);
      const end = start + word.length;
      boundaries.push({ start, end, word: word.trim() });
      currentPosition = end;
    }
  });
  
  return boundaries;
}

/**
 * Formats Arabic text for display with proper RTL directionality
 */
export function formatArabicForDisplay(text: string): string {
  // Add RTL mark and ensure proper display
  return `\u202B${text}\u202C`;
}

/**
 * Advanced word matching with configurable similarity thresholds
 */
export interface WordMatchOptions {
  minSimilarity: number;
  windowSize: number;
  exactMatchBonus: number;
  positionWeight: number;
}

export function advancedWordMatch(
  spokenWords: string[],
  referenceWords: string[],
  options: WordMatchOptions = {
    minSimilarity: 60,
    windowSize: 3,
    exactMatchBonus: 20,
    positionWeight: 0.1
  }
): Array<{ 
  spoken: string; 
  reference: string; 
  similarity: number; 
  confidence: number;
  position: number;
}> {
  const matches: Array<{ 
    spoken: string; 
    reference: string; 
    similarity: number; 
    confidence: number;
    position: number;
  }> = [];
  
  let referenceIndex = 0;
  
  spokenWords.forEach((spokenWord, spokenIndex) => {
    const bestMatch = findBestMatch(
      spokenWord,
      referenceWords,
      Math.max(0, referenceIndex - options.windowSize),
      options.windowSize * 2
    );
    
    if (bestMatch && bestMatch.similarity >= options.minSimilarity) {
      // Calculate confidence based on similarity and position proximity
      const positionDiff = Math.abs(bestMatch.index - referenceIndex);
      const positionPenalty = positionDiff * options.positionWeight;
      const confidence = Math.max(0, bestMatch.similarity - positionPenalty);
      
      // Bonus for exact matches
      const finalSimilarity = bestMatch.similarity === 100 
        ? bestMatch.similarity + options.exactMatchBonus 
        : bestMatch.similarity;
      
      matches.push({
        spoken: spokenWord,
        reference: bestMatch.word,
        similarity: Math.min(100, finalSimilarity),
        confidence,
        position: bestMatch.index
      });
      
      referenceIndex = bestMatch.index + 1;
    }
  });
  
  return matches;
}