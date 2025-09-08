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
  private readonly MULTI_LETTER_CONSONANTS = ['sz', 'cs', 'ty', 'gy', 'ny', 'zs', 'dz', 'ly'];
  private readonly DIPHTHONGS = ['ai', 'au', 'ei', 'eu', 'oi', 'ou', 'ui'];
  private readonly SPECIAL_CONSONANT_PAIRS = ['kh', 'ph', 'th'];

  private readonly verseForms: VerseForm[] = [];

  parseText(text: string): { pattern: string, syllableCount: number, moraCount: number } {
    const processedText = text.toLowerCase();
    const syllables = this.splitIntoSyllables(processedText);
    let pattern = '';
    let moraCount = 0;
    const syllableCount = syllables.length; // Count actual syllables, not just vowels

    syllables.forEach((syllable, index) => {
      const vowels = this.extractVowels(syllable);
      if (vowels.length === 0) return;

      // Ha ez az utolsó szótag
      if (index === syllables.length - 1) {
        if (pattern.endsWith('?')) {
          pattern = pattern.slice(0, -1) + '-'; // Közömbös szótag esetén hosszú
          moraCount += 2;
        } else {
          pattern += '-'; // Minden utolsó szótag hosszú
          moraCount += 2;
        }
      } else {
        const isLong = this.isLongSyllable(syllable, vowels);
        pattern += isLong ? '-' : 'U';
        moraCount += isLong ? 2 : 1;
      }
    });

    return { pattern, syllableCount, moraCount };
  }

  private extractVowels(syllable: string): string[] {
    return syllable.split('').filter(char => this.isVowel(char));
  }

  private splitIntoSyllables(text: string): string[] {
    const cleanText = text.replace(/[^a-záéíóőúűaeiouöü]/gi, ''); // Only keep letters
    const syllables: string[] = [];
    let currentSyllable = '';

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i].toLowerCase();
      currentSyllable += char;

      if (this.isVowel(char)) {
        // Check if this completes a syllable
        const nextChar = i + 1 < cleanText.length ? cleanText[i + 1].toLowerCase() : null;
        
        if (!nextChar || this.isVowel(nextChar)) {
          // End of text or next is vowel - complete syllable
          syllables.push(currentSyllable);
          currentSyllable = '';
        } else {
          // Next is consonant - look ahead to decide where to split
          let consonantCount = 0;
          let j = i + 1;
          while (j < cleanText.length && !this.isVowel(cleanText[j].toLowerCase())) {
            consonantCount++;
            j++;
          }
          
          // If only one consonant or at end, keep it with current syllable
          if (consonantCount <= 1 || j >= cleanText.length) {
            continue; // Don't split yet
          } else {
            // Multiple consonants - split after first
            currentSyllable += cleanText[i + 1];
            syllables.push(currentSyllable);
            currentSyllable = '';
            i++; // Skip the consonant we just added
          }
        }
      }
    }

    if (currentSyllable) {
      syllables.push(currentSyllable);
    }

    return syllables.filter(s => s && this.extractVowels(s).length > 0);
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
