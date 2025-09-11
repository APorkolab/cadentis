import { Injectable } from '@angular/core';

interface VerseForm {
  pattern: string;
}

@Injectable({
  providedIn: 'root'
})
export class TextParserService {
  private readonly LONG_VOWELS = 'áéíóőúű';
  private readonly SHORT_VOWELS = 'aeiouöü';
  private readonly VOWELS = this.LONG_VOWELS + this.SHORT_VOWELS;
  private readonly MULTI_LETTER_CONSONANTS = ['sz', 'cs', 'ty', 'gy', 'ny', 'zs', 'dz', 'dzs', 'ly'];
  private readonly DIPHTHONGS = ['ai', 'au', 'ei', 'eu', 'oi', 'ou', 'ui'];
  private readonly SPECIAL_CONSONANT_PAIRS = ['kh', 'ph', 'th'];
  private readonly STOPS = new Set(['p','t','k','b','d','g']);
  private readonly LIQUIDS = new Set(['r','l']);

  private readonly verseForms: VerseForm[] = [];

  parseText(text: string): { pattern: string, syllableCount: number, moraCount: number } {
    const processedText = text.toLowerCase();
    const syllables = this.splitIntoSyllables(processedText);
    let pattern = '';
    let moraCount = 0;
    const syllableCount = syllables.length; // Count actual syllables, not just vowels

    syllables.forEach((syllable) => {
      const vowels = this.extractVowels(syllable);
      if (vowels.length === 0) return;

      const isLong = this.isLongSyllable(syllable, vowels);
      pattern += isLong ? '-' : 'U';
      moraCount += isLong ? 2 : 1;
    });

    return { pattern, syllableCount, moraCount };
  }

  private extractVowels(syllable: string): string[] {
    return syllable.split('').filter(char => this.isVowel(char));
  }

  private splitIntoSyllables(text: string): string[] {
    // Syllabify per word preserving double consonants and clusters
    const words = text.split(/\s+/).filter(Boolean);
    const allSyllables: string[] = [];

    for (const rawWord of words) {
      const word = rawWord.replace(/[^a-záéíóőúűaeiouöü]/gi, '').toLowerCase();
      if (!word) continue;

      const syllables: string[] = [];
      let currentSyllable = '';

      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        currentSyllable += char;

        if (this.isVowel(char)) {
          const nextChar = i + 1 < word.length ? word[i + 1] : null;

          if (!nextChar || this.isVowel(nextChar)) {
            syllables.push(currentSyllable);
            currentSyllable = '';
          } else {
            // Look ahead to count consonants in this word only
            let consonantCount = 0;
            let j = i + 1;
            while (j < word.length && !this.isVowel(word[j])) {
              const three = word.slice(j, j + 3);
              const two = word.slice(j, j + 2);
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
              syllables.push(currentSyllable);
              currentSyllable = '';
            } else if (j >= word.length) {
              // End of word - keep all consonants with current syllable
              currentSyllable += word.slice(i + 1);
              syllables.push(currentSyllable);
              currentSyllable = '';
              break;
            } else if (consonantCount === 1) {
              // Single consonant goes with following vowel
              syllables.push(currentSyllable);
              currentSyllable = '';
            } else {
              // Multiple consonants: split after the first one (keep double consonants together)
              let consonantsToTake = 1;
              
              // Check for double consonants (same letter repeated)
              if (word[i + 1] === word[i + 2]) {
                consonantsToTake = 2; // Keep double consonants together
              }
              // Special case: ng cluster - keep together when possible
              else if (word.slice(i + 1, i + 3) === 'ng' && consonantCount >= 2) {
                consonantsToTake = 2; // Keep ng together
              }
              
              currentSyllable += word.slice(i + 1, i + 1 + consonantsToTake);
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

      allSyllables.push(...syllables);
    }

    return allSyllables.filter(s => s && this.extractVowels(s).length > 0);
  }

  private containsDiphthong(syllable: string): boolean {
    return this.DIPHTHONGS.some(diphthong => syllable.includes(diphthong));
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

  private isLongVowel(vowel: string): boolean {
    return this.LONG_VOWELS.includes(vowel);
  }

  private isVowel(char: string): boolean {
    return this.VOWELS.includes(char);
  }

  private isConsonant(char: string): boolean {
    return !this.isVowel(char) && /[a-zA-Z]/.test(char);
  }
}
