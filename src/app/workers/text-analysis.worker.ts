/// <reference lib="webworker" />

interface AnalysisRequest {
  id: string;
  text: string;
  type: 'syllable-count' | 'verse-analysis' | 'rhyme-analysis';
  chunkIndex?: number;
  totalChunks?: number;
}

interface AnalysisResponse {
  id: string;
  result: any;
  error?: string;
  chunkIndex?: number;
  totalChunks?: number;
  processingTime: number;
}

class TextAnalysisWorker {
  private readonly LONG_VOWELS = 'áéíóőúű';
  private readonly SHORT_VOWELS = 'aeiouöü';
  private readonly VOWELS = this.LONG_VOWELS + this.SHORT_VOWELS;
  private readonly MULTI_LETTER_CONSONANTS = ['sz', 'cs', 'ty', 'gy', 'ny', 'zs', 'dz', 'dzs', 'ly'];
  private readonly DIPHTHONGS = ['ai', 'au', 'ei', 'eu', 'oi', 'ou', 'ui'];
  private readonly SPECIAL_CONSONANT_PAIRS = ['kh', 'ph', 'th'];
  private readonly STOPS = new Set(['p','t','k','b','d','g']);
  private readonly LIQUIDS = new Set(['r','l']);

  constructor() {
    addEventListener('message', this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent<AnalysisRequest>) {
    const startTime = performance.now();
    const { id, text, type, chunkIndex, totalChunks } = event.data;

    try {
      let result: any;

      switch (type) {
        case 'syllable-count':
          result = this.analyzeSyllables(text);
          break;
        case 'verse-analysis':
          result = this.analyzeVerse(text);
          break;
        case 'rhyme-analysis':
          result = this.analyzeRhyme(text);
          break;
        default:
          throw new Error(`Unknown analysis type: ${type}`);
      }

      const processingTime = performance.now() - startTime;

      const response: AnalysisResponse = {
        id,
        result,
        chunkIndex,
        totalChunks,
        processingTime
      };

      postMessage(response);
    } catch (error) {
      const processingTime = performance.now() - startTime;
      const response: AnalysisResponse = {
        id,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        chunkIndex,
        totalChunks,
        processingTime
      };

      postMessage(response);
    }
  }

  private analyzeSyllables(text: string): { totalSyllables: number; totalMoras: number; lines: Array<{ syllables: number; moras: number; text: string }> } {
    const lines = text.split('\n');
    const results = lines.map(line => {
      const { syllableCount, moraCount } = this.parseText(line);
      return {
        syllables: syllableCount,
        moras: moraCount,
        text: line.trim()
      };
    });

    return {
      totalSyllables: results.reduce((sum, line) => sum + line.syllables, 0),
      totalMoras: results.reduce((sum, line) => sum + line.moras, 0),
      lines: results
    };
  }

  private analyzeVerse(text: string): any {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    return lines.map(line => {
      const { pattern, syllableCount, moraCount } = this.parseText(line);
      const stress = this.analyzeStressPattern(line);
      const caesura = this.detectCaesura(line, pattern);
      
      return {
        text: line,
        pattern,
        syllableCount,
        moraCount,
        stressPattern: stress,
        caesuraPosition: caesura,
        complexity: this.calculateComplexity(pattern, stress)
      };
    });
  }

  private analyzeRhyme(text: string): any {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const endings = lines.map(line => this.extractRhymingPart(line));
    
    const rhymePattern: string[] = [];
    const rhymeMap = new Map<string, string>();
    let currentRhyme = '';

    for (let i = 0; i < endings.length; i++) {
      const ending = endings[i];
      let foundRhyme = false;

      for (const [existingEnding, rhymeChar] of rhymeMap.entries()) {
        if (this.isStrongRhyme(ending, existingEnding)) {
          rhymePattern[i] = rhymeChar;
          foundRhyme = true;
          break;
        }
      }

      if (!foundRhyme) {
        currentRhyme = this.getNextRhymePattern(currentRhyme);
        rhymePattern[i] = currentRhyme;
        rhymeMap.set(ending, currentRhyme);
      }
    }

    return {
      pattern: rhymePattern,
      analysis: this.analyzeRhymeStructure(rhymePattern),
      confidence: this.calculateRhymeConfidence(endings, rhymePattern)
    };
  }

  private parseText(text: string): { pattern: string; syllableCount: number; moraCount: number } {
    const syllables = this.splitIntoSyllables(text);
    let pattern = '';
    let moraCount = 0;

    syllables.forEach((syllable) => {
      const vowels = this.extractVowels(syllable);
      if (vowels.length === 0) return;

      const isLong = this.isLongSyllable(syllable, vowels);
      pattern += isLong ? '-' : 'U';
      moraCount += isLong ? 2 : 1;
    });

    return { pattern, syllableCount: syllables.length, moraCount };
  }

  private splitIntoSyllables(text: string): string[] {
    // For prosodic analysis, ignore word boundaries - treat the entire line as one continuous string
    const cleanText = text.replace(/[^a-záéíóőúűaeiouöü\s]/gi, '').replace(/\s+/g, '').toLowerCase();
    if (!cleanText) return [];

    const syllables: string[] = [];
    let currentSyllable = '';

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      currentSyllable += char;

      if (this.isVowel(char)) {
        const nextChar = i + 1 < cleanText.length ? cleanText[i + 1] : null;

        if (!nextChar || this.isVowel(nextChar)) {
          // End of text or next char is vowel - complete syllable
          syllables.push(currentSyllable);
          currentSyllable = '';
        } else {
          // Look ahead to count consonants after this vowel
          let consonantCount = 0;
          let j = i + 1;
          
          while (j < cleanText.length && !this.isVowel(cleanText[j])) {
            const three = cleanText.slice(j, j + 3);
            const two = cleanText.slice(j, j + 2);
            
            if (this.MULTI_LETTER_CONSONANTS.includes(three)) {
              consonantCount++;
              j += 3;
            } else if (this.MULTI_LETTER_CONSONANTS.includes(two)) {
              consonantCount++;
              j += 2;
            } else {
              consonantCount++;
              j += 1;
            }
          }

          if (consonantCount === 0) {
            // No consonants after vowel - complete syllable
            syllables.push(currentSyllable);
            currentSyllable = '';
          } else if (j >= cleanText.length) {
            // End of text - keep all remaining consonants with current syllable
            currentSyllable += cleanText.slice(i + 1);
            syllables.push(currentSyllable);
            currentSyllable = '';
            break;
          } else if (consonantCount === 1) {
            // Single consonant goes with following vowel
            syllables.push(currentSyllable);
            currentSyllable = '';
          } else {
            // Multiple consonants: split after the first one
            // Hungarian rule: keep double consonants and special clusters together
            let consonantsToTake = 1;
            
            // Check for double consonants (same letter repeated)
            if (cleanText[i + 1] === cleanText[i + 2]) {
              consonantsToTake = 2;
            }
            // Special Hungarian clusters to keep together
            else if (cleanText.slice(i + 1, i + 3) === 'ng' && consonantCount >= 2) {
              consonantsToTake = 2;
            }
            // Multi-letter consonants should stay together
            else {
              const twoChar = cleanText.slice(i + 1, i + 3);
              const threeChar = cleanText.slice(i + 1, i + 4);
              if (this.MULTI_LETTER_CONSONANTS.includes(threeChar)) {
                consonantsToTake = 3;
              } else if (this.MULTI_LETTER_CONSONANTS.includes(twoChar)) {
                consonantsToTake = 2;
              }
            }
            
            currentSyllable += cleanText.slice(i + 1, i + 1 + consonantsToTake);
            syllables.push(currentSyllable);
            currentSyllable = '';
            i += consonantsToTake;
          }
        }
      }
    }

    if (currentSyllable) {
      syllables.push(currentSyllable);
    }

    return syllables.filter(s => s && this.extractVowels(s).length > 0);
  }

  private analyzeStressPattern(text: string): string {
    // Advanced stress pattern analysis for Hungarian text
    const syllables = this.splitIntoSyllables(text);
    let stressPattern = '';
    
    syllables.forEach((syllable, index) => {
      const isStressed = this.isStressedSyllable(syllable, index, syllables);
      stressPattern += isStressed ? 'S' : 'u';
    });
    
    return stressPattern;
  }

  private detectCaesura(text: string, pattern: string): number | null {
    // Detect caesura (metrical break) in the line
    const words = text.trim().split(/\s+/);
    if (words.length < 2) return null;
    
    let syllableCount = 0;
    for (let i = 0; i < words.length - 1; i++) {
      const wordSyllables = this.splitIntoSyllables(words[i]).length;
      syllableCount += wordSyllables;
      
      // Common caesura positions in classical meters
      if (syllableCount === Math.floor(pattern.length / 2) || 
          syllableCount === Math.floor(pattern.length * 2 / 3)) {
        return syllableCount;
      }
    }
    
    return null;
  }

  private calculateComplexity(pattern: string, stressPattern: string): number {
    let complexity = 0;
    
    // Pattern regularity
    const patternVariations = new Set(pattern).size;
    complexity += patternVariations * 0.2;
    
    // Stress-pattern alignment
    for (let i = 0; i < Math.min(pattern.length, stressPattern.length); i++) {
      const isLongAndStressed = pattern[i] === '-' && stressPattern[i] === 'S';
      const isShortAndUnstressed = pattern[i] === 'U' && stressPattern[i] === 'u';
      
      if (!(isLongAndStressed || isShortAndUnstressed)) {
        complexity += 0.3;
      }
    }
    
    return Math.min(complexity, 5); // Cap at 5
  }

  private analyzeRhymeStructure(pattern: string[]): string {
    if (pattern.length === 0) return 'No rhyme detected';
    
    const patternStr = pattern.join('');
    
    // Common rhyme schemes
    if (pattern.length === 4) {
      if (patternStr === 'abab') return 'Alternate rhyme (ABAB)';
      if (patternStr === 'abba') return 'Enclosed rhyme (ABBA)';
      if (patternStr === 'aabb') return 'Coupled rhyme (AABB)';
      if (patternStr === 'aaaa') return 'Monorhyme (AAAA)';
    }
    
    // Analyze pattern frequency
    const uniqueRhymes = new Set(pattern.filter(p => p !== 'x')).size;
    const totalLines = pattern.length;
    
    if (uniqueRhymes === 1) return 'Monorhyme';
    if (uniqueRhymes === totalLines) return 'No consistent rhyme';
    if (uniqueRhymes / totalLines < 0.5) return 'Complex rhyme scheme';
    
    return `Custom rhyme scheme (${patternStr})`;
  }

  private calculateRhymeConfidence(endings: string[], pattern: string[]): number {
    let confidence = 0;
    let pairCount = 0;
    
    for (let i = 0; i < pattern.length; i++) {
      for (let j = i + 1; j < pattern.length; j++) {
        if (pattern[i] === pattern[j] && pattern[i] !== 'x') {
          const similarity = this.calculatePhoneticSimilarity(endings[i], endings[j]);
          confidence += similarity;
          pairCount++;
        }
      }
    }
    
    return pairCount > 0 ? confidence / pairCount : 0;
  }

  private calculatePhoneticSimilarity(word1: string, word2: string): number {
    if (!word1 || !word2) return 0;
    
    const len1 = word1.length;
    const len2 = word2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1;
    
    let matches = 0;
    for (let i = 0; i < Math.min(len1, len2); i++) {
      if (word1[len1 - 1 - i] === word2[len2 - 1 - i]) {
        matches++;
      } else {
        break;
      }
    }
    
    return matches / maxLen;
  }

  // Helper methods
  private isStressedSyllable(syllable: string, index: number, allSyllables: string[]): boolean {
    // Hungarian stress is typically on the first syllable
    if (index === 0) return true;
    
    // Secondary stress patterns
    if (allSyllables.length > 4 && index % 3 === 0) return true;
    
    return false;
  }

  private extractVowels(syllable: string): string[] {
    return syllable.split('').filter(char => this.isVowel(char));
  }

  private isLongSyllable(syllable: string, vowels: string[]): boolean {
    // Special rule: the article 'a' may be long in Hungarian metrics
    if (syllable === 'a') return true;

    const hasLongVowel = this.isLongVowel(vowels[0]);
    const hasConsonantCluster = this.isLengthenedByCluster(syllable);
    const hasDiphthong = this.containsDiphthong(syllable);

    return hasLongVowel || hasConsonantCluster || hasDiphthong;
  }

  private isLengthenedByCluster(syllable: string): boolean {
    const vowelIndex = syllable.search(/[aáeéiíoóöőuúüű]/);
    if (vowelIndex === -1) return false;

    const afterVowel = syllable.slice(vowelIndex + 1);
    let consonantCount = 0;
    let i = 0;

    while (i < afterVowel.length) {
      const three = afterVowel.slice(i, i + 3).toLowerCase();
      const two = afterVowel.slice(i, i + 2).toLowerCase();

      // kh/th/ph are treated as a single short consonant (do not lengthen by themselves)
      if (this.SPECIAL_CONSONANT_PAIRS.includes(two)) {
        i += 2;
        continue;
      }

      // dzs, dz, cs, gy, ly, ny, sz, ty, zs count as single consonant units
      if (this.MULTI_LETTER_CONSONANTS.includes(three)) {
        consonantCount++;
        i += 3;
        continue;
      }
      if (this.MULTI_LETTER_CONSONANTS.includes(two)) {
        consonantCount++;
        i += 2;
        continue;
      }

      // stop+liquid (pl, pr, tr, dr, kr, gr, bl, gl, kl, br) can be short as a unit
      if (i + 1 < afterVowel.length) {
        const c1 = afterVowel[i].toLowerCase();
        const c2 = afterVowel[i + 1].toLowerCase();
        if (this.STOPS.has(c1) && this.LIQUIDS.has(c2)) {
          consonantCount += 1; // treat as one
          i += 2;
          continue;
        }
      }

      if (this.isConsonant(afterVowel[i])) {
        consonantCount++;
        i++;
      } else {
        i++;
      }
    }

    return consonantCount >= 2;
  }

  private containsDiphthong(syllable: string): boolean {
    return this.DIPHTHONGS.some(diphthong => syllable.includes(diphthong));
  }

  private isLongVowel(vowel: string): boolean {
    return this.LONG_VOWELS.includes(vowel);
  }

  private isVowel(char: string): boolean {
    return this.VOWELS.includes(char);
  }

  private isConsonant(char: string): boolean {
    return !this.isVowel(char) && /[a-zA-Z]/.test(char);
  }

  private extractRhymingPart(word: string): string {
    const cleanWord = word.toLowerCase().replace(/[!?.(),{}'\":;«»-]/g, '');
    const vowelPositions = Array.from(cleanWord).map((char, index) =>
      this.isVowel(char) ? index : -1
    ).filter(pos => pos !== -1);

    if (vowelPositions.length === 0) return cleanWord;

    const lastVowelPos = vowelPositions[vowelPositions.length - 1];
    return cleanWord.slice(lastVowelPos);
  }

  private isStrongRhyme(ending1: string, ending2: string): boolean {
    if (!ending1 || !ending2) return false;

    const vowels1 = Array.from(ending1).filter(char => this.isVowel(char));
    const vowels2 = Array.from(ending2).filter(char => this.isVowel(char));

    if (vowels1.join('') !== vowels2.join('')) return false;

    const lastVowelIdx1 = ending1.lastIndexOf(vowels1[vowels1.length - 1]);
    const lastVowelIdx2 = ending2.lastIndexOf(vowels2[vowels2.length - 1]);

    const consonants1 = ending1.slice(lastVowelIdx1 + 1);
    const consonants2 = ending2.slice(lastVowelIdx2 + 1);

    return consonants1 === consonants2;
  }

  private getNextRhymePattern(current: string): string {
    if (!current) return 'a';
    
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const currentIndex = alphabet.indexOf(current);
    
    if (currentIndex < alphabet.length - 1) {
      return alphabet[currentIndex + 1];
    }
    
    return 'aa';
  }
}

// Initialize the worker
new TextAnalysisWorker();
