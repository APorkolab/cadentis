import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TextParserService {
  private readonly HOSSZU_MAGANHANGZOK = 'áéíóőúű';
  private readonly ROVID_MAGANHANGZOK = 'aeiouöü';
  private readonly MAGANHANGZOK = this.HOSSZU_MAGANHANGZOK + this.ROVID_MAGANHANGZOK;
  private readonly MASSALHANGZOK = 'bcdfghjklmnpqrstvwxyz';
  private readonly LIKVIDA = 'rl';
  private readonly ZARHANG = 'ptkbdg';

  parseText(text: string): { pattern: string, moraCount: number } {
    const syllables = this.splitIntoSyllables(text);
    let pattern = '';
    let moraCount = 0;

    syllables.forEach((syllable, index) => {
      const isLong = this.isLongSyllable(syllable, index === syllables.length - 1);
      pattern += isLong ? '-' : 'U';
      moraCount += isLong ? 2 : 1;
    });

    return { pattern, moraCount };
  }

  private splitIntoSyllables(text: string): string[] {
    // Ez egy egyszerűsített szótagolás, a valóságban ennél komplexebb
    return text.toLowerCase().split(/(?=[aeiouáéíóöőúüű])/);
  }

  private isLongSyllable(syllable: string, isLastSyllable: boolean): boolean {
    const cleanSyllable = syllable.replace(/[^a-záéíóöőúüű]/g, '');

    // Természeténél fogva hosszú
    if (this.HOSSZU_MAGANHANGZOK.includes(cleanSyllable[0])) return true;

    // Helyzeténél fogva hosszú
    if (cleanSyllable.length > 2) return true;
    if (cleanSyllable.length === 2 && this.MASSALHANGZOK.includes(cleanSyllable[1])) return true;

    // Speciális esetek
    if (syllable.includes('a ') && !isLastSyllable) return true; // "a" névelő lehet hosszú
    if (this.ZARHANG.includes(cleanSyllable[1]) && this.LIKVIDA.includes(cleanSyllable[2])) return false;

    return false;
  }
}
