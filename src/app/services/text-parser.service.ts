import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TextParserService {
  private readonly LONG_VOWELS = 'áéíóőúű';
  private readonly SHORT_VOWELS = 'aeiouöü';
  private readonly VOWELS = this.LONG_VOWELS + this.SHORT_VOWELS;
  private readonly PUNCTUATION_MARKS = [',', '!', '.', ';'];
  private readonly MULTI_LETTER_CONSONANTS = ['sz', 'cs', 'ty', 'gy', 'ny', 'zs', 'dz', 'ly', 'Sz', 'Cs', 'Ty', 'Gy', 'Ny', 'Zs', 'Dz', 'Ly'];
  private readonly CONSONANTS = 'bcdfghjklmnpqrstvwxyz';

  parseText(text: string, splitOnPunctuation = false, splitOnLineBreaks = false): { pattern: string; moraCount: number } {
    const syllables = this.splitIntoSyllables(text, splitOnPunctuation, splitOnLineBreaks);
    let pattern = '';
    let moraCount = 0;

    for (const syllable of syllables) {
      const vowels = this.extractVowels(syllable);

      if (vowels.length === 0) continue;

      if (vowels.length === 2 && vowels.every(vowel => this.isShortVowel(vowel))) {
        pattern += 'UU';
        moraCount += 2;
      } else {
        const isLong = this.isLongVowel(vowels[0]) || this.isLengthenedByCluster(syllable);
        pattern += isLong ? '-' : 'U';
        moraCount += isLong ? 2 : 1;
      }
    }

    return { pattern, moraCount };
  }

  private extractVowels(syllable: string): string[] {
    return syllable.split('').filter(char => this.isVowel(char));
  }

  private isShortVowel(vowel: string): boolean {
    return this.SHORT_VOWELS.includes(vowel);
  }

  private splitIntoSyllables(text: string, splitOnPunctuation: boolean, splitOnLineBreaks: boolean): string[] {
    const syllables = [];
    let currentSyllable = '';
    let i = 0;

    while (i < text.length) {
      const char = text[i];
      const twoCharUnit = text.slice(i, i + 2);

      if (this.isVowel(char.toLowerCase())) {
        if (currentSyllable) syllables.push(currentSyllable);
        currentSyllable = char;
        i++;
      } else if (this.MULTI_LETTER_CONSONANTS.includes(twoCharUnit)) {
        if (currentSyllable === '') {
          currentSyllable += twoCharUnit;
        } else {
          currentSyllable += twoCharUnit;
          syllables.push(currentSyllable);
          currentSyllable = '';
        }
        i += 2;
      } else if (
        (splitOnPunctuation && this.PUNCTUATION_MARKS.includes(char)) ||
        (splitOnLineBreaks && char === '\n')
      ) {
        if (currentSyllable) {
          syllables.push(currentSyllable);
          currentSyllable = '';
        }
        i++;
      } else {
        currentSyllable += char;
        i++;
      }
    }

    if (currentSyllable) syllables.push(currentSyllable);
    return syllables;
  }

  private extractFirstVowel(syllable: string): string | null {
    for (const char of syllable) {
      if (this.isVowel(char)) return char;
    }
    return null;
  }

  private isLengthenedByCluster(syllable: string): boolean {
    const vowelIndex = syllable.search(/[aáeéiíoóöőuúüű]/);
    if (vowelIndex === -1 || vowelIndex === syllable.length - 1) return false;

    const followingChars = syllable.slice(vowelIndex + 1);
    const consonantsAfterVowel = this.getConsonantUnits(followingChars);

    // Csak akkor hosszabbítjuk meg a szótagot, ha legalább két mássalhangzó van,
    // és a többjegyű mássalhangzók közül egyik sem az "sz", "gy" stb., ami nem hosszabbít
    return consonantsAfterVowel.length > 1 &&
      consonantsAfterVowel.some(unit => !['sz', 'gy', 'cs', 'ty', 'ny', 'zs', 'dz', 'ly'].includes(unit.toLowerCase()));
  }

  private getConsonantUnits(text: string): string[] {
    const units = [];
    let i = 0;

    while (i < text.length) {
      const twoCharUnit = text.slice(i, i + 2);
      if (this.MULTI_LETTER_CONSONANTS.includes(twoCharUnit)) {
        units.push(twoCharUnit);
        i += 2;
      } else if (this.isConsonant(text[i])) {
        units.push(text[i]);
        i++;
      } else {
        i++;
      }
    }
    return units;
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
