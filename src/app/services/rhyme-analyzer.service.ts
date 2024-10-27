import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RhymeAnalyzerService {
  private readonly vowelList = ['a', 'á', 'e', 'é', 'i', 'í', 'o', 'ó', 'ö', 'ő', 'u', 'ú', 'ü', 'ű'];

  analyzeRhyme(lines: string[]): { pattern: string[], rhymeType: string } {
    const rhymePattern: string[] = [];
    const rhymes: { [key: string]: string } = {};
    let nextRhyme = 'a';

    for (const line of lines) {
      const lastWord = this.getLastWord(line);
      const rhymeEnding = this.extractEndingVowels(lastWord);

      const existingRhyme = Object.entries(rhymes).find(([ending]) => this.isRhyming(ending, rhymeEnding));
      if (existingRhyme) {
        rhymePattern.push(existingRhyme[1]);
      } else {
        rhymes[rhymeEnding] = nextRhyme;
        rhymePattern.push(nextRhyme);
        nextRhyme = String.fromCharCode(nextRhyme.charCodeAt(0) + 1);
      }
    }

    this.normalizePattern(rhymePattern);

    return {
      pattern: rhymePattern,
      rhymeType: this.identifyRhymeType(rhymePattern)
    };
  }

  private getLastWord(line: string): string {
    return line.trim().split(' ').pop() || '';
  }

  private cleanWord(word: string): string {
    return word.replace(/[!?.(),{}'":;«»\-]/g, '').trim();
  }

  private extractEndingVowels(word: string): string {
    const cleanedWord = this.cleanWord(word.toUpperCase());
    const vowels = cleanedWord.split('').filter(char => this.vowelList.includes(char));
    return vowels.slice(-2).join('');
  }

  private isRhyming(ending1: string, ending2: string): boolean {
    return ending1 === ending2;
  }

  private normalizePattern(pattern: string[]): void {
    const rhymeCounts = pattern.reduce((counts, rhyme) => {
      counts[rhyme] = (counts[rhyme] || 0) + 1;
      return counts;
    }, {} as { [key: string]: number });

    for (let i = 0; i < pattern.length; i++) {
      if (rhymeCounts[pattern[i]] === 1) {
        pattern[i] = 'x';
      }
    }
  }

  private identifyRhymeType(rhymePattern: string[]): string {
    const patternStr = rhymePattern.join('');

    if (/^(x?ax?a)$/.test(patternStr)) return 'Félrím (xAxA vagy AxAx)';
    if (/^(.)\1([a-z])\2$/.test(patternStr)) return 'Páros rím (AABB)';
    if (/^(.)\1+$/.test(patternStr)) return 'Bokorrím (AAAA...)';
    if (/^(.)[a-z](.)[a-z]$/.test(patternStr)) return 'Keresztrím (ABAB)';
    if (/^(.)[a-z](.)\2\1$/.test(patternStr)) return 'Ölelkező rím (ABBA)';

    return 'Ismeretlen rímforma';
  }
}
