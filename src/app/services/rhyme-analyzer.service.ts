import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RhymeAnalyzerService {
  private readonly vowelList = ['a', 'á', 'e', 'é', 'i', 'í', 'o', 'ó', 'ö', 'ő', 'u', 'ú', 'ü', 'ű'];

  analyzeRhyme(lines: string[]): { pattern: string[], rhymeType: string } {
    const endings = lines.map(line => this.getLastSyllable(line.trim()));
    const pattern: string[] = [];  // Üres mintával kezdünk
    let nextRhyme = 'a';

    // Az első sort ideiglenesen x-nek jelöljük
    pattern[0] = 'x';

    // Minden sort összehasonlítunk az összes többivel
    for (let i = 1; i < endings.length; i++) {
      let foundRhyme = false;

      // Összehasonlítjuk az összes korábbi sorral
      for (let j = 0; j < i; j++) {
        if (this.isRhyming(endings[i], endings[j])) {
          if (pattern[j] === 'x') {
            // Ha egy x-szel jelölt sorral rímel, mindkettő új betűt kap
            pattern[j] = pattern[i] = nextRhyme;
            nextRhyme = String.fromCharCode(nextRhyme.charCodeAt(0) + 1);
          } else {
            // Ha egy már jelölt sorral rímel, ugyanazt a betűt kapja
            pattern[i] = pattern[j];
          }
          foundRhyme = true;
          break;
        }
      }

      // Ha nem találtunk rímet, x-et kap
      if (!foundRhyme) {
        pattern[i] = 'x';
      }
    }

    return { pattern, rhymeType: this.identifyRhymeType(pattern) };
  }

  private analyzeStanza(lines: string[], startRhyme: string, alphabetRepeat: number): [string[], string, number] {
    const rhymePattern: string[] = [];
    const rhymeMap = new Map<string, string>();
    let nextRhyme = startRhyme;

    // Először gyűjtsük ki az összes végződést
    const endings = lines.map(line => {
      const lastWord = this.getLastWord(line);
      return this.extractEndingVowels(lastWord);
    });

    // Minden sorhoz keressünk rímet az aktuális versszakon belül
    for (let i = 0; i < endings.length; i++) {
      const currentEnding = endings[i];

      // Keressünk rímet a versszakon belül
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
        // Ha még nincs rím ehhez a végződéshez, új betűt kap
        rhymeMap.set(currentEnding, nextRhyme);
        rhymePattern[i] = nextRhyme;

        // Következő rím betűjének meghatározása
        nextRhyme = String.fromCharCode(nextRhyme.charCodeAt(0) + 1);
        if (nextRhyme > 'z') {
          alphabetRepeat++;
          nextRhyme = 'a'.repeat(alphabetRepeat);
        }
      }
    }

    return [rhymePattern, nextRhyme, alphabetRepeat];
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
    // Először normalizáljuk a mintát (az egyszer előforduló betűket x-re cseréljük)
    const pattern = [...rhymePattern];
    this.normalizePattern(pattern);

    const patternStr = pattern.join('');

    // Félrím: xaxa vagy axax minta (4 soros versszakokban)
    if (pattern.length === 4) {
      // Ellenőrizzük, hogy a páros vagy páratlan sorok rímelnek-e
      const evenLines = pattern[1] === pattern[3];
      const oddLines = pattern[0] === pattern[2];

      // Ha csak a páros sorok rímelnek
      if (evenLines && !oddLines) {
        return 'Félrím (xaxa)';
      }
      // Ha csak a páratlan sorok rímelnek
      if (oddLines && !evenLines) {
        return 'Félrím (axax)';
      }
    }

    // További rímformák ellenőrzése...
    return 'Ismeretlen rímforma';
  }

  private getLastSyllable(line: string): string {
    // Tisztítsuk meg a sort a pontoktól, vesszőktől a split előtt
    const cleanLine = line.replace(/[!?.,:;]/g, '');
    return cleanLine.trim().split(' ').pop() || '';
  }
}
