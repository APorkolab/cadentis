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

  analyzeVerse(event: Event): void {
    const inputText = (event.target as HTMLInputElement).value;
    const lines = inputText.split('\n').map(line => line.trim()).filter(line => line);

    this.matchedLines = lines.map(line => {
      const { pattern, moraCount } = this.textParser.parseText(line);
      const syllableCount = pattern.length;
      const verseType = this.findVerseType(pattern, moraCount);
      const substitutions = this.findSubstitutions(pattern, verseType);
      const lejtesirany = this.findMeterDirection(pattern); // Updated to `lejtesirany` to match VerseLine type

      return {
        meterPattern: pattern,
        syllableCount,
        moraCount,
        verseType: verseType ? verseType.formName : 'unknown form',
        text: line,
        rhymeScheme: '',
        substitutions,
        lejtesirany // Updated to `lejtesirany`
      };
    });

    this.rhymePattern = this.rhymeAnalyzer.analyzeRhyme(lines);
  }

  private findVerseType(pattern: string, moraCount: number): VerseForm | undefined {
    return this.verseForms.find(form =>
      form.pattern === pattern ||
      (form.pattern.length === pattern.length && form.moraCount === moraCount)
    );
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
}
