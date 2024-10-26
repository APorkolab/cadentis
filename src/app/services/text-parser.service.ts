import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TextParserService {
  private readonly LONG_VOWELS = 'áéíóőúű';
  private readonly SHORT_VOWELS = 'aeiouöü';
  private readonly VOWELS = this.LONG_VOWELS + this.SHORT_VOWELS;
  private readonly PUNCTUATION_MARKS = [',', '!', '.', ';'];
  private readonly MULTI_LETTER_CONSONANTS = ['sz', 'cs', 'ty', 'gy', 'ny', 'zs', 'dz', 'ly'];
  private readonly CONSONANTS = 'bcdfghjklmnpqrstvwxyz';

  parseText(text: string, splitOnPunctuation = false, splitOnLineBreaks = false): { pattern: string; moraCount: number } {
    const normalizedText = text.toLowerCase();
    const syllables = this.splitIntoSyllables(normalizedText, splitOnPunctuation, splitOnLineBreaks);
    let pattern = '';
    let moraCount = 0;

    syllables.forEach((syllable, index) => {
      const vowels = this.extractVowels(syllable);
      if (vowels.length === 0) return;

      const isLastSyllable = index === syllables.length - 1;
      const isLong = this.isLongSyllable(syllable, vowels, isLastSyllable);

      pattern += isLong ? '-' : 'U';
      moraCount += isLong ? 2 : 1;
    });

    return { pattern, moraCount };
  }

  private extractVowels(syllable: string): string[] {
    return syllable.split('').filter(char => this.isVowel(char));
  }

  private splitIntoSyllables(text: string, splitOnPunctuation: boolean, splitOnLineBreaks: boolean): string[] {
    const syllables: string[] = [];
    let currentSyllable = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const twoCharUnit = text.slice(i, i + 2);

      if (this.isVowel(char)) {
        currentSyllable += char;
        // Következő karakterek hozzáadása a szótaghoz
        let j = i + 1;
        while (j < text.length && !this.isVowel(text[j])) {
          currentSyllable += text[j];
          j++;
        }
        syllables.push(currentSyllable);
        currentSyllable = '';
        i = j - 1;
      } else if (
        (splitOnPunctuation && this.PUNCTUATION_MARKS.includes(char)) ||
        (splitOnLineBreaks && char === '\n')
      ) {
        if (currentSyllable) {
          syllables.push(currentSyllable);
          currentSyllable = '';
        }
      } else if (currentSyllable === '') {
        currentSyllable += char;
      }
    }

    if (currentSyllable) syllables.push(currentSyllable);
    return syllables;
  }

  private isLongSyllable(syllable: string, vowels: string[], isLastSyllable: boolean): boolean {
    if (isLastSyllable) return false;

    const hasLongVowel = this.isLongVowel(vowels[0]);
    const hasConsonantCluster = this.isLengthenedByCluster(syllable);

    return hasLongVowel || hasConsonantCluster;
  }

  private isLengthenedByCluster(syllable: string): boolean {
    const vowelIndex = syllable.search(/[aáeéiíoóöőuúüű]/);
    if (vowelIndex === -1) return false;

    const afterVowel = syllable.slice(vowelIndex + 1);
    let consonantCount = 0;
    let i = 0;

    while (i < afterVowel.length) {
      const twoCharUnit = afterVowel.slice(i, i + 2);
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
