import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RhymeAnalyzerService {
  private readonly vowelList = ['a', 'á', 'e', 'é', 'i', 'í', 'o', 'ó', 'ö', 'ő', 'u', 'ú', 'ü', 'ű'];

  analyzeRhyme(lines: string[]): { pattern: string[], rhymeType: string } {
    // Versszakok szétválasztása
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

    // Minden versszakot külön elemzünk
    const patterns: string[] = [];
    for (const stanza of stanzas) {
      const stanzaPattern = this.analyzeStanza(stanza);
      patterns.push(...stanzaPattern);
    }

    return {
      pattern: patterns,
      rhymeType: this.identifyRhymeType(patterns)
    };
  }

  private analyzeStanza(lines: string[]): string[] {
    const rhymePattern: string[] = [];
    let nextRhyme = 'a';  // Az első rímpár 'a' betűt kap
    const rhymeMap = new Map<string, string>();  // A végződések és betűk párosítása

    // Először gyűjtsük ki az összes végződést
    const endings = lines.map(line => {
      const lastWord = this.getLastWord(line);
      return this.extractEndingVowels(lastWord);
    });

    // Minden sorhoz keressünk rímet
    for (let i = 0; i < endings.length; i++) {
      const currentEnding = endings[i];

      // Keressük meg, hogy van-e már ilyen rím
      let foundMatch = false;
      for (const [ending, rhyme] of rhymeMap.entries()) {
        if (this.isRhyming(currentEnding, ending)) {
          rhymePattern[i] = rhyme;
          foundMatch = true;
          break;
        }
      }

      // Ha nem találtunk rímet
      if (!foundMatch) {
        // Ha páros sor és még nincs rím hozzá, új betűt kap
        if (i % 2 === 1) {
          rhymeMap.set(currentEnding, nextRhyme);
          rhymePattern[i] = nextRhyme;
          nextRhyme = String.fromCharCode(nextRhyme.charCodeAt(0) + 1);
        } else {
          // Páratlan sor x-et kap
          rhymePattern[i] = 'x';
        }
      }
    }

    return rhymePattern;
  }

  private getLastWord(line: string): string {
    // Tisztítsuk meg a sort a pontoktól, vesszőktől a split előtt
    const cleanLine = line.replace(/[!?.,:;]/g, '');
    return cleanLine.trim().split(' ').pop() || '';
  }

  private cleanWord(word: string): string {
    // Eltávolítjuk az összes írásjelet, kivéve a magyar ékezeteket
    return word.replace(/[!?.(),{}'":;«»\-]/g, '').trim();
  }

  private extractEndingVowels(word: string): string {
    const cleanedWord = this.cleanWord(word.toLowerCase());

    // Az utolsó szótag megtalálása
    let lastSyllable = '';
    let foundVowel = false;

    for (let i = cleanedWord.length - 1; i >= 0; i--) {
      const char = cleanedWord[i];
      if (this.vowelList.includes(char)) {
        foundVowel = true;
        lastSyllable = char + lastSyllable;
        // Csak az első mássalhangzót vesszük az utolsó magánhangzó után
        if (i + 1 < cleanedWord.length) {
          lastSyllable += cleanedWord[i + 1];
        }
        break;
      }
      if (!foundVowel) {
        lastSyllable = char + lastSyllable;
      }
    }

    console.log(`Word: ${word}, Last syllable: ${lastSyllable}`);
    return lastSyllable;
  }

  private isRhyming(ending1: string, ending2: string): boolean {
    if (!ending1 || !ending2) return false;

    // Tisztítsuk meg a végződéseket a dupla mássalhangzóktól
    const clean1 = ending1.replace(/([^aáeéiíoóöőuúüű])\1+/g, '$1');
    const clean2 = ending2.replace(/([^aáeéiíoóöőuúüű])\1+/g, '$1');

    // Az "őt-előtt" típusú rímek kezelése
    const shorter = clean1.length <= clean2.length ? clean1 : clean2;
    const longer = clean1.length <= clean2.length ? clean2 : clean1;

    console.log(`Comparing cleaned: ${clean1} - ${clean2}`);
    return longer.endsWith(shorter);
  }

  private normalizePattern(pattern: string[]): void {
    // Számoljuk a betűk előfordulását
    const counts: { [key: string]: number } = {};
    for (const letter of pattern) {
      if (letter !== 'x') {
        counts[letter] = (counts[letter] || 0) + 1;
      }
    }

    // Ha egy betű csak egyszer fordul elő, cseréljük x-re
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] !== 'x' && counts[pattern[i]] === 1) {
        pattern[i] = 'x';
      }
    }
  }

  private identifyRhymeType(rhymePattern: string[]): string {
    const patternStr = rhymePattern.join('');

    // Először a félrímet ellenőrizzük
    if (/^x?ax?a$/.test(patternStr)) return 'Félrím (xAxA vagy AxAx)';
    // Ezután a specifikusabb mintákat
    if (/^(.)\1\1\1$/.test(patternStr)) return 'Bokorrím (AAAA...)';
    if (/^(.)\1([a-z])\2$/.test(patternStr)) return 'Páros rím (AABB)';
    if (/^(.)[a-z](.)[a-z]$/.test(patternStr)) return 'Keresztrím (ABAB)';
    if (/^(.)[a-z](.)\2\1$/.test(patternStr)) return 'Ölelkező rím (ABBA)';

    return 'Ismeretlen rímforma';
  }
}
