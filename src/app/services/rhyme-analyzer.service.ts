import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RhymeAnalyzerService {
  private readonly vowelList = ['a', 'á', 'e', 'é', 'i', 'í', 'o', 'ó', 'ö', 'ő', 'u', 'ú', 'ü', 'ű'];
  private readonly alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

  private getNextRhymePattern(current: string, forceA = false): string {
    if (!current || forceA) return 'a';

    if (current.length === 1) {
      const currentIndex = this.alphabet.indexOf(current);
      if (currentIndex < this.alphabet.length - 1) {
        return this.alphabet[currentIndex + 1];
      }
      return 'aa';
    }

    const lastChar = current[current.length - 1];
    const prefix = current.slice(0, -1);

    const lastCharIndex = this.alphabet.indexOf(lastChar);
    if (lastCharIndex < this.alphabet.length - 1) {
      return prefix + this.alphabet[lastCharIndex + 1];
    }

    return 'a'.repeat(prefix.length + 1);
  }

  public analyzeRhyme(lines: string[]): { pattern: string[], rhymeType: string } {
    const stanzas: string[][] = [];
    let currentStanza: string[] = [];

    for (const line of lines) {
      if (line.trim() === '') {
        if (currentStanza.length > 0) {
          stanzas.push(currentStanza);
          currentStanza = [];
        }
      } else {
        currentStanza.push(line);
      }
    }
    if (currentStanza.length > 0) {
      stanzas.push(currentStanza);
    }

    const patterns: string[] = [];
    for (const stanza of stanzas) {
      const stanzaPattern = this.analyzeStanza(stanza);
      patterns.push(...stanzaPattern);
    }

    // Először alakítsuk át x-szé a magányos rímeket
    const processedPatterns = patterns.map((char) => {
      const count = patterns.filter(p => p === char).length;
      return count > 1 ? char : 'x';
    });

    // Majd rendezzük újra a betűket, kihagyva az x-eket
    const finalPatterns = this.reassignLetters(processedPatterns);

    return {
      pattern: finalPatterns,
      rhymeType: this.identifyRhymeType(finalPatterns)
    };
  }

  private reassignLetters(patterns: string[]): string[] {
    const letterMapping = new Map<string, string>();
    let nextLetter = 'a';

    // Hozzuk létre az új betű hozzárendeléseket, kihagyva az x-eket
    for (const char of patterns) {
      if (char !== 'x' && !letterMapping.has(char)) {
        letterMapping.set(char, nextLetter);
        nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
      }
    }

    // Alkalmazzuk az új betűket
    return patterns.map(char => char === 'x' ? 'x' : letterMapping.get(char)!);
  }

  private analyzeStanza(lines: string[]): string[] {
    const rhymePattern: string[] = [];
    let currentRhyme = '';
    const rhymeMap = new Map<string, string>();

    const endings = lines.map(line => {
      const lastWord = this.getLastWord(line);
      return this.extractRhymingPart(lastWord);
    });

    for (let i = 0; i < endings.length; i++) {
      const currentEnding = endings[i];

      let foundRhyme = false;
      for (const [existingEnding, rhymeChar] of rhymeMap.entries()) {
        if (this.isStrongRhyme(currentEnding, existingEnding)) {
          rhymePattern[i] = rhymeChar;
          foundRhyme = true;
          break;
        }
      }

      if (!foundRhyme) {
        if (i < 2 || this.shouldAssignNewPattern(currentEnding, endings, i)) {
          currentRhyme = this.getNextRhymePattern(currentRhyme);
          rhymePattern[i] = currentRhyme;
          rhymeMap.set(currentEnding, currentRhyme);
        } else {
          rhymePattern[i] = 'x';
        }
      }
    }

    return rhymePattern;
  }

  private ensurePairing(char: string, pattern: string[]): string {
    const occurrenceCount = pattern.filter(p => p === char).length;
    return occurrenceCount > 1 ? char : 'x';
  }

  private shouldAssignNewPattern(currentEnding: string, allEndings: string[], currentIndex: number): boolean {
    for (let i = currentIndex + 1; i < allEndings.length; i++) {
      if (this.isStrongRhyme(currentEnding, allEndings[i])) {
        return true;
      }
    }
    return false;
  }

  private getLastWord(line: string): string {
    const cleanLine = line.replace(/[!?.,:;]/g, '');
    return cleanLine.trim().split(' ').pop() || '';
  }

  private extractRhymingPart(word: string): string {
    const cleanWord = word.toLowerCase().replace(/[!?.(),{}'":;«»-]/g, '');

    const vowelPositions = Array.from(cleanWord).map((char, index) =>
      this.vowelList.includes(char) ? index : -1
    ).filter(pos => pos !== -1);

    if (vowelPositions.length === 0) return cleanWord;

    const lastVowelPos = vowelPositions[vowelPositions.length - 1];
    return cleanWord.slice(lastVowelPos);
  }

  private isStrongRhyme(ending1: string, ending2: string): boolean {
    if (!ending1 || !ending2) return false;

    const vowels1 = Array.from(ending1).filter(char => this.vowelList.includes(char));
    const vowels2 = Array.from(ending2).filter(char => this.vowelList.includes(char));

    if (vowels1.join('') !== vowels2.join('')) return false;

    const lastVowelIdx1 = ending1.lastIndexOf(vowels1[vowels1.length - 1]);
    const lastVowelIdx2 = ending2.lastIndexOf(vowels2[vowels2.length - 1]);

    const consonants1 = ending1.slice(lastVowelIdx1 + 1);
    const consonants2 = ending2.slice(lastVowelIdx2 + 1);

    return consonants1 === consonants2 ||
      (consonants1.length === consonants2.length &&
        this.areConsonantsSimilar(consonants1, consonants2));
  }

  private areConsonantsSimilar(cons1: string, cons2: string): boolean {
    const similarGroups = [
      ['b', 'p'], ['d', 't'], ['g', 'k'],
      ['v', 'f'], ['z', 's'], ['zs', 'sz'],
      ['gy', 'ty'], ['ny', 'n']
    ];

    return similarGroups.some(group =>
      (group.includes(cons1) && group.includes(cons2))
    );
  }

  private identifyRhymeType(rhymePattern: string[]): string {
    if (this.matchesPattern(rhymePattern, ['x', 'a', 'x', 'a'])) return 'Félrím (xAxA)';
    if (this.matchesPattern(rhymePattern, ['a', 'x', 'a', 'x'])) return 'Félrím (AxAx)';
    if (this.allSamePattern(rhymePattern, 4)) return 'Bokorrím (AAAA)';
    if (this.matchesPairsPattern(rhymePattern)) return 'Páros rím (AABB)';
    if (this.matchesPattern(rhymePattern, ['a', 'b', 'a', 'b'])) return 'Keresztrím (ABAB)';
    if (this.matchesPattern(rhymePattern, ['a', 'b', 'b', 'a'])) return 'Ölelkező rím (ABBA)';

    return 'Ismeretlen rímforma';
  }

  private matchesPattern(actual: string[], pattern: string[]): boolean {
    if (actual.length !== pattern.length) return false;
    const mapping = new Map<string, string>();
    const usedValues = new Set<string>();

    for (let i = 0; i < actual.length; i++) {
      if (pattern[i] === 'x') {
        if (actual[i] !== 'x') return false;
        continue;
      }

      if (mapping.has(pattern[i])) {
        if (mapping.get(pattern[i]) !== actual[i]) return false;
      } else {
        if (usedValues.has(actual[i])) return false;
        mapping.set(pattern[i], actual[i]);
        usedValues.add(actual[i]);
      }
    }
    return true;
  }

  private allSamePattern(pattern: string[], length: number): boolean {
    if (pattern.length !== length) return false;
    return new Set(pattern).size === 1 && !pattern.includes('x');
  }

  private matchesPairsPattern(pattern: string[]): boolean {
    if (pattern.length !== 4) return false;
    return pattern[0] === pattern[1] && pattern[2] === pattern[3] &&
      pattern[0] !== pattern[2] && !pattern.includes('x');
  }
}