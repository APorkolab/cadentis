import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RhymeAnalyzerService {
  analyzeRhyme(lines: string[]): { pattern: string[], rhymeType: string } {
    const rhymePattern: string[] = [];
    const rhymes: { [key: string]: string } = {};
    let nextRhyme = 'a';

    for (const line of lines) {
      const lastWord = this.getLastWord(line);
      const rhymeEnding = this.getRhymeEnding(lastWord);

      // Ha már van ilyen rím
      if (Object.entries(rhymes).some(([key, value]) =>
        this.isRhyming(key, rhymeEnding) && value !== 'x')) {
        const existingRhyme = Object.entries(rhymes).find(([key]) =>
          this.isRhyming(key, rhymeEnding))?.[1];
        rhymePattern.push(existingRhyme || 'x');
      } else {
        // Ha nincs még ilyen rím
        rhymes[rhymeEnding] = nextRhyme;
        rhymePattern.push(nextRhyme);
        nextRhyme = String.fromCharCode(nextRhyme.charCodeAt(0) + 1);
      }
    }

    return {
      pattern: rhymePattern,
      rhymeType: this.identifyRhymeType(rhymePattern)
    };
  }

  private getLastWord(line: string): string {
    const words = line.trim().split(' ');
    return words[words.length - 1];
  }

  private getRhymeEnding(word: string): string {
    // Az utolsó magánhangzótól kezdve az összes hang
    const match = word.match(/[aeiouáéíóöőúüű][^aeiouáéíóöőúüű]*$/i);
    return match ? match[0].toLowerCase() : word.toLowerCase();
  }

  private isRhyming(ending1: string, ending2: string): boolean {
    // Egyszerű összehasonlítás az utolsó magánhangzótól
    return ending1.toLowerCase() === ending2.toLowerCase();
  }

  private identifyRhymeType(rhymePattern: string[]): string {
    const patternStr = rhymePattern.join('');

    // Félrím ellenőrzése előre kerül és pontosabb mintával
    if (patternStr === 'xaxa' || patternStr === 'axax') return 'Félrím (xAxA vagy AxAx)';
    if (/^(.)\1([a-z])\2$/.test(patternStr)) return 'Páros rím (AABB)';
    if (/^(.)\1\1+$/.test(patternStr)) return 'Bokorrím (AAA...)';
    if (/^(.)[a-z](.)[a-z]$/.test(patternStr)) return 'Keresztrím (ABAB)';
    if (/^(.)[a-z](.)\2\1$/.test(patternStr)) return 'Ölelkező rím (ABBA)';

    return 'Ismeretlen rímforma';
  }
}
