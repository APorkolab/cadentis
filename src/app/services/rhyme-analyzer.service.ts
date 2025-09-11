import { Injectable } from '@angular/core';

// Rím típusok enum
export enum RhymeType {
  CleanRhyme = 'Tiszta rím',
  Assonance = 'Asszonánc', 
  ConsonantRhyme = 'Mássalhangzós asszonánc',
  CrookedRhyme = 'Kancsal rím',
  GoatRhyme = 'Kecskerím',
  TortureRhyme = 'Kínrím',
  LineRhyme = 'Sorrím',
  EchoRhyme = 'Visszhangrím',
  TruncatedRhyme = 'Csonka rím',
  MasculineRhyme = 'Hímrím',
  FeminineRhyme = 'Nőrím',
  NoRhyme = 'Rímtelen'
}

// Rímképlet típusok
export enum RhymeScheme {
  CrossRhyme = 'Keresztrím (ABAB)',
  CoupletsRhyme = 'Páros rím (AABB)', 
  EnclosedRhyme = 'Ölelkező rím (ABBA)',
  ClusterRhyme = 'Bokorrím (AAAA)',
  HalfRhyme = 'Félrím',
  ReturningRhyme = 'Visszatérő rím',
  ChainRhyme = 'Ráütő rím',
  UnknownRhyme = 'Ismeretlen rímképlet'
}

@Injectable({
  providedIn: 'root'
})
export class RhymeAnalyzerService {
  private readonly vowelList = ['a', 'á', 'e', 'é', 'i', 'í', 'o', 'ó', 'ö', 'ő', 'u', 'ú', 'ü', 'ű'];
  private readonly consonantList = ['b','c','d','f','g','h','j','k','l','m','n','p','q','r','s','t','v','w','x','y','z','cs','dz','dzs','gy','ly','ny','sz','ty','zs'];
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
    
    // Teljes egyezés (tiszta rím vagy önrím)
    if (ending1 === ending2) return true;
    
    const rhymeType = this.detectRhymeType(ending1, ending2);
    return rhymeType !== RhymeType.NoRhyme;
  }
  
  /**
   * Magyar rímfajták felismerése
   */
  private detectRhymeType(ending1: string, ending2: string): RhymeType {
    if (!ending1 || !ending2) return RhymeType.NoRhyme;
    
    // Teljes egyezés - tiszta rím
    if (ending1 === ending2) return RhymeType.CleanRhyme;
    
    const vowels1 = this.extractVowels(ending1);
    const vowels2 = this.extractVowels(ending2);
    const consonants1 = this.extractConsonants(ending1);
    const consonants2 = this.extractConsonants(ending2);
    
    // Kecskerím - mássalhangzók felcserélve
    if (this.isGoatRhyme(ending1, ending2)) return RhymeType.GoatRhyme;
    
    // Kínrím (mozaikrím) - azonos hangzás, különböző szóhatárok
    if (this.isTortureRhyme(ending1, ending2)) return RhymeType.TortureRhyme;
    
    // Kancsal rím - mássalhangzók egyeznek, magánhangzók különböznek  
    if (consonants1.join('') === consonants2.join('') && vowels1.join('') !== vowels2.join('')) {
      return RhymeType.CrookedRhyme;
    }
    
    // Asszonánc - magánhangzók egyeznek
    if (vowels1.join('') === vowels2.join('')) {
      // Mássalhangzós asszonánc - mássalhangzók is egyeznek
      if (consonants1.join('') === consonants2.join('')) {
        return RhymeType.ConsonantRhyme;
      }
      // Tiszta asszonánc - csak magánhangzók egyeznek
      return RhymeType.Assonance;
    }
    
    // Hím/nő rím ellenőrzés
    const rhythm1 = this.getRhymeRhythm(ending1);
    const rhythm2 = this.getRhymeRhythm(ending2);
    
    // Legalább az utolsó szótag egyezzen
    const lastSyllable1 = this.getLastSyllable(ending1);
    const lastSyllable2 = this.getLastSyllable(ending2);
    
    if (this.syllablesRhyme(lastSyllable1, lastSyllable2)) {
      if (rhythm1 === 'U-' && rhythm2 === 'U-') return RhymeType.MasculineRhyme;
      if (rhythm1 === '-U' && rhythm2 === '-U') return RhymeType.FeminineRhyme;
      return RhymeType.Assonance; // Gyenge asszonánc
    }
    
    return RhymeType.NoRhyme;
  }

  /**
   * Magánhangzók kinyernése szóból
   */
  private extractVowels(word: string): string[] {
    return Array.from(word.toLowerCase()).filter(char => this.vowelList.includes(char));
  }
  
  /**
   * Mássalhangzók kinyernése szóból  
   */
  private extractConsonants(word: string): string[] {
    return Array.from(word.toLowerCase()).filter(char => 
      /[a-záéíóőúűäöü]/i.test(char) && !this.vowelList.includes(char)
    );
  }
  
  /**
   * Kecskerím ellenőrzés - mássalhangzók felcserélve
   */
  private isGoatRhyme(word1: string, word2: string): boolean {
    // Példák: "kupán" - "kapun", "haján" - "kalász"  
    const chars1 = Array.from(word1.toLowerCase());
    const chars2 = Array.from(word2.toLowerCase());
    
    if (chars1.length !== chars2.length) return false;
    
    let differences = 0;
    const swappedPairs: number[] = [];
    
    for (let i = 0; i < chars1.length; i++) {
      if (chars1[i] !== chars2[i]) {
        differences++;
        swappedPairs.push(i);
      }
    }
    
    // Pontosan 2 vagy 4 különböző karakternek kell lennie (páros felcserélés)
    if (differences === 2) {
      const [pos1, pos2] = swappedPairs;
      return chars1[pos1] === chars2[pos2] && chars1[pos2] === chars2[pos1];
    }
    
    return false;
  }
  
  /**
   * Kínrím ellenőrzés - azonos hangzás, különböző szóhatárok
   */
  private isTortureRhyme(ending1: string, ending2: string): boolean {
    // Példák: "fülemüle" - "fülem, ül-e", "érte sültem" - "értesültem"
    const clean1 = ending1.replace(/\s+/g, '');
    const clean2 = ending2.replace(/\s+/g, '');
    
    return clean1 === clean2 && ending1.includes(' ') !== ending2.includes(' ');
  }
  
  /**
   * Rím ritmusának meghatározása (hím/nőrím)
   */
  private getRhymeRhythm(word: string): string {
    const syllables = this.splitToSyllables(word);
    if (syllables.length === 0) return '';
    
    const lastSyllable = syllables[syllables.length - 1];
    const vowels = this.extractVowels(lastSyllable);
    
    if (vowels.length === 0) return '';
    
    const isLongVowel = ['á','é','í','ó','ő','ú','ű'].includes(vowels[vowels.length - 1]);
    const endsWithConsonant = !/[aáeéiíoóöőuúüű]$/i.test(lastSyllable);
    
    if (isLongVowel || endsWithConsonant) {
      return syllables.length > 1 ? 'U-' : '-'; // Jambikus (hímrím)
    } else {
      return syllables.length > 1 ? '-U' : 'U'; // Trochaikus (nőrím)
    }
  }
  
  /**
   * Egyszerű szótagolás rímfelismeréshez
   */
  private splitToSyllables(word: string): string[] {
    // Egyszerűsített szótagolás - magánhangzók alapján
    const syllables: string[] = [];
    let currentSyllable = '';
    
    for (const char of word.toLowerCase()) {
      currentSyllable += char;
      if (this.vowelList.includes(char)) {
        syllables.push(currentSyllable);
        currentSyllable = '';
      }
    }
    
    if (currentSyllable) {
      // Utolsó szótaghoz adjuk a maradék mássalhangzókat
      if (syllables.length > 0) {
        syllables[syllables.length - 1] += currentSyllable;
      } else {
        syllables.push(currentSyllable);
      }
    }
    
    return syllables;
  }
  
  /**
   * Utolsó szótag kinyernése
   */
  private getLastSyllable(word: string): string {
    const syllables = this.splitToSyllables(word);
    return syllables.length > 0 ? syllables[syllables.length - 1] : word;
  }
  
  /**
   * Két szótag rímelésének ellenőrzése
   */
  private syllablesRhyme(syllable1: string, syllable2: string): boolean {
    const vowels1 = this.extractVowels(syllable1);
    const vowels2 = this.extractVowels(syllable2);
    
    // Legalább az utolsó magánhangzó egyezzen
    if (vowels1.length === 0 || vowels2.length === 0) return false;
    
    const lastVowel1 = vowels1[vowels1.length - 1];
    const lastVowel2 = vowels2[vowels2.length - 1];
    
    return this.vowelsRhyme(lastVowel1, lastVowel2);
  }
  
  /**
   * Magánhangzók rímelése (hasonló hangzású magánhangzók)
   */
  private vowelsRhyme(vowel1: string, vowel2: string): boolean {
    if (vowel1 === vowel2) return true;
    
    const rhymeGroups = [
      ['a', 'á'], ['e', 'é'], ['i', 'í'], ['o', 'ó'], 
      ['ö', 'ő'], ['u', 'ú'], ['ü', 'ű']
    ];
    
    return rhymeGroups.some(group => 
      group.includes(vowel1) && group.includes(vowel2)
    );
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

  /**
   * Két karaktertömb hasonlóságának számítása
   */
  private calculateArraySimilarity(arr1: string[], arr2: string[]): number {
    if (arr1.length === 0 && arr2.length === 0) return 1;
    if (arr1.length === 0 || arr2.length === 0) return 0;

    const maxLength = Math.max(arr1.length, arr2.length);
    let matches = 0;

    for (let i = 0; i < maxLength; i++) {
      const char1 = arr1[i] || '';
      const char2 = arr2[i] || '';
      
      if (char1 === char2) {
        matches++;
      } else if (this.vowelList.includes(char1) && this.vowelList.includes(char2)) {
        if (this.vowelsRhyme(char1, char2)) {
          matches += 0.5;
        }
      } else if (!this.vowelList.includes(char1) && !this.vowelList.includes(char2)) {
        if (this.areConsonantsSimilar(char1, char2)) {
          matches += 0.5;
        }
      }
    }

    return matches / maxLength;
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