import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RhymeAnalyzerService {
  private readonly vowelList = ['a', 'á', 'e', 'é', 'i', 'í', 'o', 'ó', 'ö', 'ő', 'u', 'ú', 'ü', 'ű'];

  analyzeRhyme(lines: string[]): { pattern: string[], rhymeType: string } {
    const stanzas: string[][] = [];
    let currentStanza: string[] = [];

    // Versszakok azonosítása üres sorok mentén
    for (const line of lines) {
      if (line.trim() === '') {
        if (currentStanza.length > 0) {
          stanzas.push(currentStanza);
          currentStanza = [];
        }
      } else {
        currentStanza.push(line.trim());
      }
    }
    // Az utolsó versszak hozzáadása, ha nincs lezárva üres sorral
    if (currentStanza.length > 0) {
      stanzas.push(currentStanza);
    }

    const pattern: string[] = [];
    let nextRhyme = 'a';
    const usedRhymes = new Map<string, string>();  // Egész versre érvényes rímjelek

    // Minden versszakot külön elemzünk
    for (const stanza of stanzas) {
      const stanzaPattern = this.analyzeStanza(stanza, nextRhyme, usedRhymes);
      pattern.push(...stanzaPattern);
      // Frissítjük a következő szabad rím betűt
      const lastUsedRhyme = stanzaPattern[stanzaPattern.length - 1];
      nextRhyme = String.fromCharCode(lastUsedRhyme.charCodeAt(0) + 1);
    }

    return { pattern, rhymeType: this.identifyRhymeType(pattern) };
  }

  private analyzeStanza(lines: string[], startRhyme: string, usedRhymes: Map<string, string>): string[] {
    const stanzaPattern: string[] = [];
    const stanzaRhymeMap = new Map<string, string>();  // Csak a jelenlegi versszakra érvényes
    let nextRhyme = startRhyme;

    const endings = lines.map(line => this.extractEndingVowels(this.getLastWord(line)));

    for (let i = 0; i < endings.length; i++) {
      const currentEnding = endings[i];
      let foundMatch = false;

      // Keresés csak az aktuális versszakon belül
      for (const [ending, rhyme] of stanzaRhymeMap.entries()) {
        if (this.isRhyming(currentEnding, ending)) {
          stanzaPattern[i] = rhyme;
          usedRhymes.set(currentEnding, rhyme); // Egész versre elmentjük
          foundMatch = true;
          break;
        }
      }

      // Ha nincs találat, új rím betűt rendelünk
      if (!foundMatch) {
        stanzaRhymeMap.set(currentEnding, nextRhyme);
        stanzaPattern[i] = nextRhyme;
        usedRhymes.set(currentEnding, nextRhyme); // Egész versre elmentjük

        nextRhyme = String.fromCharCode(nextRhyme.charCodeAt(0) + 1);
      }
    }

    return stanzaPattern;
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
    const pattern = [...rhymePattern];
    this.normalizePattern(pattern);
    const patternStr = pattern.join('');

    if (pattern.length === 4) {
      const evenLines = pattern[1] === pattern[3];
      const oddLines = pattern[0] === pattern[2];

      if (evenLines && !oddLines) {
        return 'Félrím (xaxa)';
      }
      if (oddLines && !evenLines) {
        return 'Félrím (axax)';
      }
      if (patternStr === 'aabb') {
        return 'Páros rím (aabb)';
      }
      if (patternStr === 'abab') {
        return 'Keresztrím (abab)';
      }
      if (patternStr === 'abba') {
        return 'Ölelkező rím (abba)';
      }
    }

    if (pattern.every(char => char === 'a')) {
      return 'Bokorrím (aaaa)';
    }

    return 'Ismeretlen rímforma';
  }

  private getLastSyllable(line: string): string {
    // Tisztítsuk meg a sort a pontoktól, vesszőktől a split előtt
    const cleanLine = line.replace(/[!?.,:;]/g, '');
    return cleanLine.trim().split(' ').pop() || '';
  }
}
