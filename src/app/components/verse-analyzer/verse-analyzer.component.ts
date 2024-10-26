import { Component, OnInit } from '@angular/core';
import { VerseFormService } from '../../services/verse-form.service';
import { TextParserService } from '../../services/text-parser.service';
import { RhymeAnalyzerService } from '../../services/rhyme-analyzer.service';
import { VerseLine } from '../../models/verse-line.model';
import { VerseResultComponent } from '../verse-result/verse-result.component';
import { VerseForm } from '../../models/verse-form.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-verse-analyzer',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, VerseResultComponent],
  templateUrl: './verse-analyzer.component.html',
  styleUrls: ['./verse-analyzer.component.css']
})
export class VerseAnalyzerComponent implements OnInit {
  verseForms: VerseForm[] = [];
  matchedLines: VerseLine[] = [];
  rhymePattern: string[] = [];

  constructor(
    private verseFormService: VerseFormService,
    private textParser: TextParserService,
    private rhymeAnalyzer: RhymeAnalyzerService
  ) { }

  ngOnInit(): void {
    this.verseFormService.getVerseForms().subscribe(forms => {
      this.verseForms = forms;
    });
  }

  private patternSimilarity(pattern1: string, pattern2: string): number {
    const minLength = Math.min(pattern1.length, pattern2.length);
    let matches = 0;
    for (let i = 0; i < minLength; i++) {
      if (pattern1[i] === pattern2[i]) matches++;
    }
    return matches / Math.max(pattern1.length, pattern2.length);
  }

  private findVerseType(pattern: string, moraCount: number): { form: VerseForm | undefined, approximate: boolean } {
    // Speciális minták ellenőrzése először
    if (this.isHexameter(pattern)) {
      return { form: this.verseForms.find(form => form.formName === 'hexameter'), approximate: false };
    }
    if (this.isPentameter(pattern)) {
      return { form: this.verseForms.find(form => form.formName === 'pentameter'), approximate: false };
    }

    // Ha nem speciális minta, akkor keresés hasonlóság alapján
    let bestMatch: VerseForm | undefined;
    let bestSimilarity = 0;

    this.verseForms.forEach(form => {
      const similarity = this.patternSimilarity(pattern, form.pattern);
      if (similarity > bestSimilarity) { // Csak a legjobb egyezést keressük
        bestMatch = form;
        bestSimilarity = similarity;
      }
    });

    return {
      form: bestMatch,
      approximate: bestMatch ? bestSimilarity < 1 : false
    };
  }

  private isHexameter(pattern: string): boolean {
    // Ellenőrizzük, hogy x-re végződik
    if (!pattern.endsWith('x')) return false;

    // Vágjuk le az utolsó x-et
    const mainPattern = pattern.slice(0, -1);

    // Ellenőrizzük a hosszt (12-16 karakter + x)
    if (mainPattern.length < 12 || mainPattern.length > 16) return false;

    // Csak megengedett karaktereket tartalmazhat
    if (!/^[-U]+$/.test(mainPattern)) return false;

    // Legalább egy -UU mintának kell lennie benne
    if (!mainPattern.includes('-UU')) return false;

    // Ne legyen pentameter (kizárjuk a -UU-UUx végződést)
    if (pattern.endsWith('-UU-UUx')) return false;

    return true;
  }

  private isPentameter(pattern: string): boolean {
    // Ellenőrizzük, hogy x-re végződik
    if (!pattern.endsWith('x')) return false;

    // A pentameter második fele MINDIG -UU-UU
    if (!pattern.endsWith('-UU-UUx')) return false;

    // Az első fél tetszőleges hosszúságú lehet, de csak - és U karaktereket tartalmazhat
    const firstHalf = pattern.slice(0, -7);
    if (!/^[-U]+$/.test(firstHalf)) return false;

    // Ellenőrizzük a teljes hosszt (ne legyen túl hosszú vagy rövid)
    if (pattern.length < 12 || pattern.length > 14) return false;

    return true;
  }

  private findSubstitutions(pattern: string, verseType: VerseForm | undefined): string[] {
    if (!verseType) return [];
    const substitutions: string[] = [];
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] !== verseType.pattern[i]) {
        substitutions.push(`${pattern[i] === '-' ? 'Long' : 'Short'} instead of ${verseType.pattern[i] === '-' ? 'long' : 'short'} at position ${i + 1}`);
      }
    }
    return substitutions;
  }

  private findMeterDirection(pattern: string): 'emelkedő' | 'ereszkedő' | 'vegyes' {
    const rising = pattern.match(/U-/g)?.length || 0;
    const falling = pattern.match(/-U/g)?.length || 0;
    if (rising > falling) return 'emelkedő';
    if (falling > rising) return 'ereszkedő';
    return 'vegyes';
  }

  analyzeVerse(event: Event): void {
    const inputText = (event.target as HTMLTextAreaElement).value;
    const lines = inputText.split('\n').map(line => line.trim()).filter(line => line);

    this.matchedLines = lines.map((line, index) => {
      const { pattern, moraCount } = this.textParser.parseText(line);
      const syllableCount = pattern.length;
      const substitutions: string[] = [];
      const lejtesirany = this.findMeterDirection(pattern);

      // Vers típus meghatározása
      const { form, approximate } = this.findVerseType(pattern, moraCount);
      let formName = form ? form.formName : 'unknown form';

      // Csak a közelítő egyezésnél adjuk hozzá a ~ jelet
      if (approximate) {
        formName = '~' + formName;
      }

      // Csak pontos egyezésnél adjuk hozzá a + jelet
      if (form && !approximate) {
        formName = '+' + formName;
      }

      return {
        meterPattern: pattern,
        syllableCount,
        moraCount,
        verseType: formName,
        text: line,
        rhymeScheme: '',
        substitutions,
        lejtesirany
      };
    });

    // Disztichonok azonosítása második körben
    for (let i = 0; i < this.matchedLines.length - 1; i++) {
      if (
        (this.matchedLines[i].verseType === 'hexameter' || this.matchedLines[i].verseType.includes('disztichon')) &&
        i + 1 < this.matchedLines.length
      ) {
        this.matchedLines[i].verseType = 'disztichon (hexameter)';
        this.matchedLines[i + 1].verseType = 'disztichon (pentameter)';
      }
    }

    this.rhymePattern = this.rhymeAnalyzer.analyzeRhyme(lines);
  }
}
