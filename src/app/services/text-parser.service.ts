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
    // Syllabify per word, preserving word boundaries to avoid merging consonants across words
    const words = text.split(/\s+/).filter(Boolean);
    const allSyllables: string[] = [];

    for (const rawWord of words) {
      const word = rawWord.replace(/[^a-záéíóőúűaeiouöü]/gi, '');
      if (!word) continue;

      const syllables: string[] = [];
      let currentSyllable = '';

      for (let i = 0; i < word.length; i++) {
        const char = word[i].toLowerCase();
        currentSyllable += char;

        if (this.isVowel(char)) {
          const nextChar = i + 1 < word.length ? word[i + 1].toLowerCase() : null;

          if (!nextChar || this.isVowel(nextChar)) {
            syllables.push(currentSyllable);
            currentSyllable = '';
          } else {
            // Look ahead within the same word to count consonants after the vowel
            let consonantCount = 0;
            let j = i + 1;
            while (j < word.length && !this.isVowel(word[j].toLowerCase())) {
              const twoCharUnit = word.slice(j, j + 2).toLowerCase();
              const threeCharUnit = word.slice(j, j + 3).toLowerCase();
              if (this.MULTI_LETTER_CONSONANTS.includes(threeCharUnit)) {
                consonantCount++;
                j += 3;
              } else if (this.MULTI_LETTER_CONSONANTS.includes(twoCharUnit)) {
                consonantCount++;
                j += 2;
              } else {
                consonantCount++;
                j += 1;
              }
            }

            if (consonantCount === 0) {
              // No consonants after vowel - complete the syllable
              syllables.push(currentSyllable);
              currentSyllable = '';
            } else if (j >= word.length) {
              // End of word - keep all remaining consonants with current syllable
              currentSyllable += word.slice(i + 1);
              syllables.push(currentSyllable);
              currentSyllable = '';
              break;
            } else if (consonantCount === 1) {
              // Single consonant goes with the following vowel
              syllables.push(currentSyllable);
              currentSyllable = '';
            } else {
              // Multiple consonants: split after the first consonant unit
              const nextTwo = word.slice(i + 1, i + 3).toLowerCase();
              const nextThree = word.slice(i + 1, i + 4).toLowerCase();
              if (this.MULTI_LETTER_CONSONANTS.includes(nextThree)) {
                currentSyllable += word.slice(i + 1, i + 4);
                i += 3;
              } else if (this.MULTI_LETTER_CONSONANTS.includes(nextTwo)) {
                currentSyllable += word.slice(i + 1, i + 3);
                i += 2;
              } else {
                currentSyllable += word[i + 1];
                i += 1;
              }
              syllables.push(currentSyllable);
              currentSyllable = '';
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
      const twoCharUnit = afterVowel.slice(i, i + 2);

      // Ha speciális páros, nem növeli a hosszúságot
      if (this.SPECIAL_CONSONANT_PAIRS.includes(twoCharUnit)) {
        i += 2;
        continue; // Ugrás a következő iterációra, mivel ezt nem számoljuk
      }

      if (this.MULTI_LETTER_CONSONANTS.includes(twoCharUnit)) {
        consonantCount++;
        i += 2;
      } else if (this.isConsonant(afterVowel[i])) {
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
