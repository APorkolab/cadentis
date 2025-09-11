import { Injectable } from '@angular/core';

interface VerseForm {
  name: string;
  pattern: RegExp;
  description: string;
  examples: string[];
}

interface MetricalFoot {
  name: string;
  pattern: string;
  moraeCount: number;
  description: string;
  examples: string[];
}

interface ProsodyAnalysis {
  pattern: string;
  syllableCount: number;
  moraCount: number;
  metricFeet: string[];
  verseForm?: string;
  rhythm: string;
}

@Injectable({
  providedIn: 'root'
})
export class TextParserService {
  private readonly LONG_VOWELS = 'áéíóőúű';
  private readonly SHORT_VOWELS = 'aeiouöü';
  private readonly VOWELS = this.LONG_VOWELS + this.SHORT_VOWELS;
  private readonly MULTI_LETTER_CONSONANTS = ['sz', 'cs', 'ty', 'gy', 'ny', 'zs', 'dz', 'dzs', 'ly'];
  private readonly DIPHTHONGS = ['ai', 'au', 'ei', 'eu', 'oi', 'ou', 'ui'];
  private readonly SPECIAL_CONSONANT_PAIRS = ['kh', 'ph', 'th'];
  private readonly STOPS = new Set(['p','t','k','b','d','g']);
  private readonly LIQUIDS = new Set(['r','l']);

  // Magyar metrikai lábak katalógusa (2-6 mora)
  private readonly metricalFeet: MetricalFoot[] = [
    // 2 morás lábak
    { name: 'Jambus', pattern: 'U-', moraeCount: 2, description: 'rövid-hosszú', examples: ['virág', 'madár', 'repül'] },
    { name: 'Trocheus', pattern: '-U', moraeCount: 2, description: 'hosszú-rövid', examples: ['alma', 'kerte', 'haza'] },
    { name: 'Spondeus', pattern: '--', moraeCount: 4, description: 'hosszú-hosszú', examples: ['szárnyas', 'mély tó'] },
    { name: 'Pyrrhichius', pattern: 'UU', moraeCount: 2, description: 'rövid-rövid', examples: ['keze', 'lepe'] },
    
    // 3 morás lábak
    { name: 'Daktylus', pattern: '-UU', moraeCount: 3, description: 'hosszú-rövid-rövid', examples: ['sárguló', 'bánatom'] },
    { name: 'Anapestus', pattern: 'UU-', moraeCount: 3, description: 'rövid-rövid-hosszú', examples: ['szerelem', 'vidáman'] },
    { name: 'Amfibrachus', pattern: 'U-U', moraeCount: 3, description: 'rövid-hosszú-rövid', examples: ['repülök', 'magyarok'] },
    { name: 'Molosszus', pattern: '---', moraeCount: 6, description: 'hosszú-hosszú-hosszú', examples: ['méltóság', 'hősi dél'] },
    { name: 'Tribrachus', pattern: 'UUU', moraeCount: 3, description: 'rövid-rövid-rövid', examples: ['szeretek', 'kerekek'] },
    
    // 4 morás lábak  
    { name: 'Dispondeus', pattern: '----', moraeCount: 8, description: 'négy hosszú', examples: ['méltó név', 'szép dal zeng'] },
    { name: 'Prokeleusmatikus', pattern: 'UUUU', moraeCount: 4, description: 'négy rövid', examples: ['repegetek', 'kerekeken'] },
    { name: 'Ionicus a maiore', pattern: '--UU', moraeCount: 4, description: 'hosszú-hosszú-rövid-rövid', examples: ['mélységbe', 'hősi lélek'] },
    { name: 'Ionicus a minore', pattern: 'UU--', moraeCount: 4, description: 'rövid-rövid-hosszú-hosszú', examples: ['szerelem szép', 'vidám szív'] },
    { name: 'Choriambus', pattern: '-UU-', moraeCount: 4, description: 'hosszú-rövid-rövid-hosszú', examples: ['bánatosan', 'sárgulóban'] },
    { name: 'Antispastus', pattern: 'U--U', moraeCount: 4, description: 'rövid-hosszú-hosszú-rövid', examples: ['szeretnélek', 'repülnének'] },
    
    // 5 morás lábak
    { name: 'Paeon primus', pattern: '-UUU', moraeCount: 4, description: 'hosszú-rövid-rövid-rövid', examples: ['mélységesen', 'bánatosan'] },
    { name: 'Paeon secundus', pattern: 'U-UU', moraeCount: 4, description: 'rövid-hosszú-rövid-rövid', examples: ['repülgetek', 'magyarokan'] },
    { name: 'Paeon tertius', pattern: 'UU-U', moraeCount: 4, description: 'rövid-rövid-hosszú-rövid', examples: ['szeretőmnek', 'vidámabbá'] },
    { name: 'Paeon quartus', pattern: 'UUU-', moraeCount: 4, description: 'rövid-rövid-rövid-hosszú', examples: ['kerekedén', 'szeretetéért'] },
    
    // 6 morás lábak
    { name: 'Epitritus primus', pattern: 'U---', moraeCount: 7, description: 'rövid-hosszú-hosszú-hosszú', examples: ['repülő sas szárnyán'] },
    { name: 'Epitritus secundus', pattern: '-U--', moraeCount: 7, description: 'hosszú-rövid-hosszú-hosszú', examples: ['mélyen ülő hős láng'] },
    { name: 'Epitritus tertius', pattern: '--U-', moraeCount: 7, description: 'hosszú-hosszú-rövid-hosszú', examples: ['hős lélek repül'] },
    { name: 'Epitritus quartus', pattern: '---U', moraeCount: 7, description: 'hosszú-hosszú-hosszú-rövid', examples: ['mély szép dallamos keze'] }
  ];
  
  // Magyar versformák katalógusa
  private readonly verseForms: VerseForm[] = [
    {
      name: 'Klasszikus hexameter',
      pattern: /^(-UU|--) (-UU|--) (-UU|--) (-UU|--) -UU --$/,
      description: 'Hat daktylus/spondeus láb, ötödik kötelezően daktylus',
      examples: ['Énekelj istennő Akhilleusz haragjáról a végzetes']
    },
    {
      name: 'Klasszikus pentameter',
      pattern: /^(-UU|--) (-UU|--) - (-UU|--) (-UU|--) -$/,
      description: 'Két és fél daktylus/spondeus láb, majd szünet, majd két és fél daktylus',
      examples: ['Hősi vitéz aki száll | messze hazájából el']
    },
    {
      name: 'Saphói strofa',
      pattern: /^-U--UU-U--$/,
      description: 'Klasszikus leszboszi versmérték',
      examples: ['Mély bánattal telve szívem']
    },
    {
      name: 'Alkaioszi strofa',
      pattern: /^-U-U--UU-U-$/,
      description: 'Klasszikus leszboszi versmérték',
      examples: ['Szárnyaló sasként repülök']
    },
    {
      name: 'Asklepiadészi sor',
      pattern: /^--UU-UU-U--$/,
      description: 'Choriambus alapú antik versmérték',
      examples: ['Mélyen alszik a tenger csendje']
    },
    {
      name: 'Magyar népdalritmus',
      pattern: /^(U-|-)+(U-|-)+(U-|-)+(U-|-)+$/,
      description: 'Hagyományos magyar népdal ütemezés',
      examples: ['Repülj madár, repülj messze']
    },
    {
      name: 'Alexandrinus',
      pattern: /^(-U|--)(-U|--)(-U|--) \| (-U|--)(-U|--)(-U|--)$/,
      description: 'Klasszikus francia 12 szótagos sor',
      examples: ['Mély bánatban ülök messze | halk szellő fújdogál']
    }
  ];

  parseText(text: string): ProsodyAnalysis {
    const processedText = text.toLowerCase();
    const syllables = this.splitIntoSyllables(processedText);
    let pattern = '';
    let moraCount = 0;
    const syllableCount = syllables.length; // Count actual syllables, not just vowels

    syllables.forEach((syllable) => {
      const vowels = this.extractVowels(syllable);
      if (vowels.length === 0) return;

      const isLong = this.isLongSyllable(syllable, vowels);
      pattern += isLong ? '-' : 'U';
      moraCount += isLong ? 2 : 1;
    });

    // Analyze metrical feet
    const metricFeet = this.analyzeMetricalFeet(pattern);
    
    // Identify verse form
    const verseForm = this.identifyVerseForm(pattern);
    
    // Determine rhythm
    const rhythm = this.determineRhythm(pattern);

    return { 
      pattern, 
      syllableCount, 
      moraCount, 
      metricFeet,
      verseForm,
      rhythm
    };
  }

  private extractVowels(syllable: string): string[] {
    return syllable.split('').filter(char => this.isVowel(char));
  }

  private splitIntoSyllables(text: string): string[] {
    // For prosodic analysis, ignore word boundaries - treat the entire line as one continuous string
    const cleanText = text.replace(/[^a-záéíóőúűaeiouöü\s]/gi, '').replace(/\s+/g, '').toLowerCase();
    if (!cleanText) return [];

    const syllables: string[] = [];
    let currentSyllable = '';

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      currentSyllable += char;

      if (this.isVowel(char)) {
        const nextChar = i + 1 < cleanText.length ? cleanText[i + 1] : null;

        if (!nextChar || this.isVowel(nextChar)) {
          // End of text or next char is vowel - complete syllable
          syllables.push(currentSyllable);
          currentSyllable = '';
        } else {
          // Look ahead to count consonants after this vowel
          let consonantCount = 0;
          let j = i + 1;
          
          while (j < cleanText.length && !this.isVowel(cleanText[j])) {
            const three = cleanText.slice(j, j + 3);
            const two = cleanText.slice(j, j + 2);
            
            if (this.MULTI_LETTER_CONSONANTS.includes(three)) {
              consonantCount++;
              j += 3;
            } else if (this.MULTI_LETTER_CONSONANTS.includes(two)) {
              consonantCount++;
              j += 2;
            } else {
              consonantCount++;
              j += 1;
            }
          }

          if (consonantCount === 0) {
            // No consonants after vowel - complete syllable
            syllables.push(currentSyllable);
            currentSyllable = '';
          } else if (j >= cleanText.length) {
            // End of text - keep all remaining consonants with current syllable
            currentSyllable += cleanText.slice(i + 1);
            syllables.push(currentSyllable);
            currentSyllable = '';
            break;
          } else if (consonantCount === 1) {
            // Single consonant goes with following vowel
            syllables.push(currentSyllable);
            currentSyllable = '';
          } else {
            // Multiple consonants: split after the first one
            // Hungarian rule: keep double consonants and special clusters together
            let consonantsToTake = 1;
            
            // Check for double consonants (same letter repeated)
            if (cleanText[i + 1] === cleanText[i + 2]) {
              consonantsToTake = 2;
            }
            // Special Hungarian clusters to keep together
            else if (cleanText.slice(i + 1, i + 3) === 'ng' && consonantCount >= 2) {
              consonantsToTake = 2;
            }
            // Multi-letter consonants should stay together
            else {
              const twoChar = cleanText.slice(i + 1, i + 3);
              const threeChar = cleanText.slice(i + 1, i + 4);
              if (this.MULTI_LETTER_CONSONANTS.includes(threeChar)) {
                consonantsToTake = 3;
              } else if (this.MULTI_LETTER_CONSONANTS.includes(twoChar)) {
                consonantsToTake = 2;
              }
            }
            
            currentSyllable += cleanText.slice(i + 1, i + 1 + consonantsToTake);
            syllables.push(currentSyllable);
            currentSyllable = '';
            i += consonantsToTake;
          }
        }
      }
    }

    if (currentSyllable) {
      syllables.push(currentSyllable);
    }

    return syllables.filter(s => s && this.extractVowels(s).length > 0);
  }

  private containsDiphthong(syllable: string): boolean {
    return this.DIPHTHONGS.some(diphthong => syllable.includes(diphthong));
  }

  private isLongSyllable(syllable: string, vowels: string[]): boolean {
    // Special rule: the article 'a' may be long in Hungarian metrics
    if (syllable === 'a') return true;

    // If no vowels, can't determine length
    if (vowels.length === 0) return false;

    // Long vowel makes syllable long
    const hasLongVowel = this.isLongVowel(vowels[0]);
    if (hasLongVowel) return true;

    // Consonant cluster can lengthen the syllable
    const hasConsonantCluster = this.isLengthenedByCluster(syllable);
    const hasDiphthong = this.containsDiphthong(syllable);

    return hasConsonantCluster || hasDiphthong;
  }

  private isLengthenedByCluster(syllable: string): boolean {
    const vowelIndex = syllable.search(/[aáeéiíoóöőuúüű]/);
    if (vowelIndex === -1) return false;

    const afterVowel = syllable.slice(vowelIndex + 1);
    let consonantCount = 0;
    let i = 0;

    while (i < afterVowel.length) {
      const three = afterVowel.slice(i, i + 3).toLowerCase();
      const two = afterVowel.slice(i, i + 2).toLowerCase();

      // kh/th/ph are treated as a single short consonant (do not lengthen by themselves)
      if (this.SPECIAL_CONSONANT_PAIRS.includes(two)) {
        i += 2;
        continue;
      }

      // dzs, dz, cs, gy, ly, ny, sz, ty, zs count as single consonant units
      if (this.MULTI_LETTER_CONSONANTS.includes(three)) {
        consonantCount++;
        i += 3;
        continue;
      }
      if (this.MULTI_LETTER_CONSONANTS.includes(two)) {
        consonantCount++;
        i += 2;
        continue;
      }

      // stop+liquid (pl, pr, tr, dr, kr, gr, bl, gl, kl, br) can be short as a unit
      if (i + 1 < afterVowel.length) {
        const c1 = afterVowel[i].toLowerCase();
        const c2 = afterVowel[i + 1].toLowerCase();
        if (this.STOPS.has(c1) && this.LIQUIDS.has(c2)) {
          consonantCount += 1; // treat as one
          i += 2;
          continue;
        }
      }

      if (this.isConsonant(afterVowel[i])) {
        consonantCount++;
        i++;
      } else {
        i++;
      }
    }

    return consonantCount >= 2;
  }

  private isLongVowel(vowel: string): boolean {
    return this.LONG_VOWELS.includes(vowel);
  }

  private isVowel(char: string): boolean {
    return this.VOWELS.includes(char);
  }

  private isConsonant(char: string): boolean {
    return !this.isVowel(char) && /[a-zA-Z]/.test(char);
  }

  /**
   * Metrikai lábak felismerése a mintázatban
   */
  private analyzeMetricalFeet(pattern: string): string[] {
    const feet: string[] = [];
    let currentPattern = pattern;
    let position = 0;

    while (position < currentPattern.length) {
      let foundFoot = false;
      
      // Próbáljuk meg a leghosszabb lábaktól a legrövidebbekig
      const sortedFeet = [...this.metricalFeet].sort((a, b) => b.pattern.length - a.pattern.length);
      
      for (const foot of sortedFeet) {
        if (currentPattern.slice(position).startsWith(foot.pattern)) {
          feet.push(foot.name);
          position += foot.pattern.length;
          foundFoot = true;
          break;
        }
      }
      
      if (!foundFoot) {
        // Ha nem találtunk lábat, ugorjuk át az aktuális poziciót
        position++;
      }
    }
    
    return feet;
  }

  /**
   * Versforma azonosítás
   */
  private identifyVerseForm(pattern: string): string | undefined {
    for (const form of this.verseForms) {
      if (form.pattern.test(pattern)) {
        return form.name;
      }
    }
    
    // Speciális esetek ellenőrzése
    if (this.isHexameter(pattern)) {
      return 'Klasszikus hexameter (variáns)';
    }
    
    if (this.isPentameter(pattern)) {
      return 'Klasszikus pentameter (variáns)';
    }
    
    return undefined;
  }

  /**
   * Hexameter ellenőrzés (rugalmasabb)
   */
  private isHexameter(pattern: string): boolean {
    // Hexameter: 6 láb, első 4 lehet daktylus vagy spondeus,
    // 5. kötelezően daktylus, 6. spondeus vagy trocheus
    const hexameterRegex = /^(-UU|--){0,4}-UU(-U|--)?$/;
    return hexameterRegex.test(pattern) && pattern.length >= 12;
  }

  /**
   * Pentameter ellenőrzés (rugalmasabb)
   */
  private isPentameter(pattern: string): boolean {
    // Pentameter: 2.5 + 2.5 láb daktylus/spondeus mintaval
    const pentameterRegex = /^(-UU|--){1,2}-?\s*(-UU|--){1,2}-?$/;
    return pentameterRegex.test(pattern) && pattern.length >= 8;
  }

  /**
   * Ritmus meghatározása
   */
  private determineRhythm(pattern: string): string {
    if (pattern.length === 0) return 'Ismeretlen';
    
    const longCount = (pattern.match(/-/g) || []).length;
    const shortCount = (pattern.match(/U/g) || []).length;
    
    // Hangsúlymérték ellerőrzése
    if (this.isIambic(pattern)) {
      return 'Jambikus ritmus (U-U-U-...)';
    } else if (this.isTrochaic(pattern)) {
      return 'Trochaikus ritmus (-U-U-U...)';
    } else if (this.isDactylic(pattern)) {
      return 'Daktilikus ritmus (-UU-UU...)';
    } else if (this.isAnapestic(pattern)) {
      return 'Anapestikus ritmus (UU-UU-...)';
    }
    
    // Általános arány
    const ratio = longCount / (longCount + shortCount);
    if (ratio > 0.7) {
      return 'Hangsúlyos ritmus (sok hosszú szótag)';
    } else if (ratio < 0.3) {
      return 'Gyors ritmus (sok rövid szótag)';
    } else {
      return 'Vegyes ritmus';
    }
  }

  /**
   * Jambikus ritmus ellenőrzés
   */
  private isIambic(pattern: string): boolean {
    return /^(U-)+U?$/.test(pattern);
  }

  /**
   * Trochaikus ritmus ellenőrzés
   */
  private isTrochaic(pattern: string): boolean {
    return /^(-U)+[-]?$/.test(pattern);
  }

  /**
   * Daktilikus ritmus ellenőrzés
   */
  private isDactylic(pattern: string): boolean {
    return /^(-UU)+[-]?$/.test(pattern);
  }

  /**
   * Anapestikus ritmus ellenőrzés
   */
  private isAnapestic(pattern: string): boolean {
    return /^(UU-)+[U]?$/.test(pattern);
  }

  /**
   * Kibővített elemési függvény verssorokhoz
   */
  analyzeVerse(text: string): {
    lines: ProsodyAnalysis[];
    totalSyllables: number;
    totalMoras: number;
    dominantRhythm: string;
    possibleMeter: string;
  } {
    const lines = text.split('\n').filter(line => line.trim());
    const analyses = lines.map(line => this.parseText(line));
    
    const totalSyllables = analyses.reduce((sum, analysis) => sum + analysis.syllableCount, 0);
    const totalMoras = analyses.reduce((sum, analysis) => sum + analysis.moraCount, 0);
    
    // Domináns ritmus meghatározása
    const rhythms = analyses.map(a => a.rhythm);
    const dominantRhythm = this.getMostFrequent(rhythms);
    
    // Lehetséges versmérték
    const patterns = analyses.map(a => a.pattern).join(' | ');
    let possibleMeter = 'Vegyes versmérték';
    
    // Ellenőrizzük, hogy minden sor ugyanaz-e
    if (analyses.length > 1) {
      const firstPattern = analyses[0].pattern;
      if (analyses.every(a => a.pattern === firstPattern)) {
        possibleMeter = `Izometrikus: ${analyses[0].verseForm || 'Ismeretlen mérték'}`;
      }
    }
    
    return {
      lines: analyses,
      totalSyllables,
      totalMoras,
      dominantRhythm,
      possibleMeter
    };
  }

  /**
   * Leggyakoribb elem megkeresése egy tömbben
   */
  private getMostFrequent<T>(arr: T[]): T {
    const frequency: Map<T, number> = new Map();
    
    for (const item of arr) {
      frequency.set(item, (frequency.get(item) || 0) + 1);
    }
    
    let mostFrequent = arr[0];
    let maxCount = 0;
    
    for (const [item, count] of frequency) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = item;
      }
    }
    
    return mostFrequent;
  }
}
