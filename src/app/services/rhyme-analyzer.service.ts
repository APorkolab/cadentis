import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RhymeAnalyzerService {
  analyzeRhyme(lines: string[]): string {
    const rhymeScheme: string[] = [];
    const rhymes: Map<string, string> = new Map();
    let currentLabel = 'a';

    lines.forEach(line => {
      const lastWord = this.getLastWord(line);
      const rhymeEnding = this.getRhymeEnding(lastWord);

      if (rhymes.has(rhymeEnding)) {
        rhymeScheme.push(rhymes.get(rhymeEnding) as string);
      } else {
        rhymes.set(rhymeEnding, currentLabel);
        rhymeScheme.push(currentLabel);
        currentLabel = String.fromCharCode(currentLabel.charCodeAt(0) + 1);
      }
    });

    return rhymeScheme.join('');
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
