import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RhymeAnalyzerService {
  analyzeRhyme(lines: string[]): string[] {
    // Implementáljuk a rímképlet elemzését
    const rhymePattern: string[] = [];
    const rhymes: { [key: string]: string } = {};
    let nextRhyme = 'a';

    for (const line of lines) {
      const lastWord = this.getLastWord(line);
      const rhymeEnding = this.getRhymeEnding(lastWord);

      if (rhymes[rhymeEnding]) {
        rhymePattern.push(rhymes[rhymeEnding]);
      } else {
        rhymes[rhymeEnding] = nextRhyme;
        rhymePattern.push(nextRhyme);
        nextRhyme = String.fromCharCode(nextRhyme.charCodeAt(0) + 1);
      }
    }

    return rhymePattern;
  }

  private getLastWord(line: string): string {
    const words = line.trim().split(' ');
    return words[words.length - 1];
  }

  private getRhymeEnding(word: string): string {
    const match = word.match(/[aeiouáéíóöőúüű][^aeiouáéíóöőúüű]*$/i);
    return match ? match[0].toLowerCase() : word;
  }
}
