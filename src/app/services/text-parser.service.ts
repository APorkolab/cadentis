import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TextParserService {
  parseText(text: string): { syllables: string[], pattern: string } {
    const syllables = this.splitIntoSyllables(text);
    const pattern = this.determineMeterPattern(syllables);
    return { syllables, pattern };
  }

  private splitIntoSyllables(text: string): string[] {
    return text.match(/([aeiouáéíóöőúüű]{1,2}|[^aeiouáéíóöőúüű]+)/g) || [];
  }

  private determineMeterPattern(syllables: string[]): string {
    return syllables.map(s => s.length === 1 ? 'U' : '-').join('');
  }
}
