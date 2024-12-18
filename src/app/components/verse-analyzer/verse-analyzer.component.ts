import { Component, OnInit } from '@angular/core';
import { VerseFormService } from '../../services/verse-form.service';
import { TextParserService } from '../../services/text-parser.service';
import { RhymeAnalyzerService } from '../../services/rhyme-analyzer.service';
import { VerseLine } from '../../models/verse-line.model';
import { VerseResultComponent } from '../verse-result/verse-result.component';
import { VerseForm } from '../../models/verse-form.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verse-analyzer',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, VerseResultComponent, CommonModule],
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

  private isHexameter(pattern: string): boolean {
    const mainPattern = pattern.replace(/[x\?]$/, '');

    if (mainPattern.length < 13 || mainPattern.length > 17) {
      return false;
    }

    if (!/^[-U]+$/.test(mainPattern)) {
      return false;
    }

    const firstFourFeet = mainPattern.slice(0, -5);
    const feetPattern = /^(-UU|--)+$/;
    if (!feetPattern.test(firstFourFeet)) {
      return false;
    }

    const fifthFoot = mainPattern.slice(-5, -2);
    if (fifthFoot !== '-UU') {
      return false;
    }

    const lastFoot = mainPattern.slice(-2);
    return lastFoot === '--' || lastFoot === '-U';
  }

  private isPentameter(pattern: string): boolean {
    const mainPattern = pattern.replace(/[x\?]$/, '');

    if (mainPattern.length < 12 || mainPattern.length > 14) {
      return false;
    }

    const secondHalf = mainPattern.slice(-7);
    if (secondHalf !== '-UU-UU-') {
      return false;
    }

    const firstHalf = mainPattern.slice(0, -7);
    const validFirstHalf = /^(-UU|--)(-UU|--)[-]$/;

    return validFirstHalf.test(firstHalf);
  }

  private findVerseType(pattern: string, moraCount: number): { form: VerseForm | undefined, approximate: boolean } {
    if (this.isHexameter(pattern)) {
      return { form: this.verseForms.find(form => form.formName === 'hexameter'), approximate: false };
    }
    if (this.isPentameter(pattern)) {
      return { form: this.verseForms.find(form => form.formName === 'pentameter'), approximate: false };
    }

    let bestMatch: VerseForm | undefined;
    let bestSimilarity = 0;

    this.verseForms.forEach(form => {
      const similarity = this.patternSimilarity(pattern, form.pattern);
      if (similarity > bestSimilarity) {
        bestMatch = form;
        bestSimilarity = similarity;
      }
    });

    return {
      form: bestMatch,
      approximate: bestMatch ? bestSimilarity < 1 : false
    };
  }

  private patternSimilarity(pattern1: string, pattern2: string): number {
    const minLength = Math.min(pattern1.length, pattern2.length);
    let matches = 0;
    for (let i = 0; i < minLength; i++) {
      if (pattern1[i] === pattern2[i]) matches++;
    }
    return matches / Math.max(pattern1.length, pattern2.length);
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
      const { pattern, syllableCount, moraCount } = this.textParser.parseText(line);
      const substitutions: string[] = this.findSubstitutions(pattern, this.findVerseType(pattern, moraCount).form);
      const lejtesirany = this.findMeterDirection(pattern);

      const { form, approximate } = this.findVerseType(pattern, moraCount);
      let formName = form ? form.formName : 'unknown form';

      if (approximate) formName = '~' + formName;
      if (form && !approximate) formName = '+' + formName;

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

    const { pattern: rhymePattern, rhymeType } = this.rhymeAnalyzer.analyzeRhyme(lines);
    this.rhymePattern = rhymePattern;

    this.matchedLines = this.matchedLines.map((line, index) => ({
      ...line,
      rhymeScheme: rhymePattern[index] || ''
    }));

    for (let i = 0; i < this.matchedLines.length - 1; i += 2) {
      const currentLine = this.matchedLines[i];
      const nextLine = this.matchedLines[i + 1];

      if (this.isHexameter(currentLine.meterPattern) &&
        this.isPentameter(nextLine.meterPattern)) {
        currentLine.verseType = '+disztichon (hexameter)';
        nextLine.verseType = '+disztichon (pentameter)';
        currentLine.isDisztichonPart = true;
        nextLine.isDisztichonPart = true;
      }
    }
  }

}
