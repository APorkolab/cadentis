import { Injectable } from '@angular/core';
import { TextParserService } from './text-parser.service';
import { RhymeAnalyzerService } from './rhyme-analyzer.service';
import { VerseFormService } from './verse-form.service';
import { VerseLine } from '../models/verse-line.model';
import { VerseForm } from '../models/verse-form.model';
import { MetricalDirection, VerseType } from '../models/verse.enums';

@Injectable({
  providedIn: 'root'
})
export class VerseAnalysisService {
  private verseForms: VerseForm[] = [];

  constructor(
    private textParser: TextParserService,
    private rhymeAnalyzer: RhymeAnalyzerService,
    private verseFormService: VerseFormService
  ) {
    this.verseFormService.getVerseForms().subscribe(forms => {
      this.verseForms = forms;
    });
  }

  public analyze(text: string): VerseLine[] {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    let matchedLines = lines.map((line, index) => {
      const { pattern, syllableCount, moraCount } = this.textParser.parseText(line);
      const { form, approximate } = this.findVerseType(pattern, moraCount);
      const substitutions: string[] = this.findSubstitutions(pattern, form);
      const lejtesirany = this.findMeterDirection(pattern);

      let formName: string = form ? form.formName : VerseType.Unknown;
      if (approximate && form) formName = `~${form.formName}`;
      if (form && !approximate) formName = `+${form.formName}`;

      const verseLine = new VerseLine();
      verseLine.meterPattern = pattern;
      verseLine.syllableCount = syllableCount;
      verseLine.moraCount = moraCount;
      verseLine.verseType = formName;
      verseLine.text = line;
      verseLine.substitutions = substitutions;
      verseLine.lejtesirany = lejtesirany;
      return verseLine;
    });

    const { pattern: rhymePattern } = this.rhymeAnalyzer.analyzeRhyme(lines);

    matchedLines = matchedLines.map((line, index) => {
      line.rhymeScheme = rhymePattern[index] || '';
      return line;
    });

    for (let i = 0; i < matchedLines.length - 1; i += 2) {
      const currentLine = matchedLines[i];
      const nextLine = matchedLines[i + 1];

      if (this.isHexameter(currentLine.meterPattern) && this.isPentameter(nextLine.meterPattern)) {
        currentLine.verseType = VerseType.DistichonHexameter;
        nextLine.verseType = VerseType.DistichonPentameter;
        currentLine.isDisztichonPart = true;
        nextLine.isDisztichonPart = true;
      }
    }

    return matchedLines;
  }

  private isHexameter(pattern: string): boolean {
    const mainPattern = pattern.replace(/[x\?]$/, '');
    if (mainPattern.length < 13 || mainPattern.length > 17) return false;
    if (!/^[-U]+$/.test(mainPattern)) return false;
    const firstFourFeet = mainPattern.slice(0, -5);
    const feetPattern = /^(-UU|--)+$/;
    if (!feetPattern.test(firstFourFeet)) return false;
    const fifthFoot = mainPattern.slice(-5, -2);
    if (fifthFoot !== '-UU') return false;
    const lastFoot = mainPattern.slice(-2);
    return lastFoot === '--' || lastFoot === '-U';
  }

  private isPentameter(pattern: string): boolean {
    const mainPattern = pattern.replace(/[x\?]$/, '');
    if (mainPattern.length < 12 || mainPattern.length > 14) return false;
    const secondHalf = mainPattern.slice(-7);
    if (secondHalf !== '-UU-UU-') return false;
    const firstHalf = mainPattern.slice(0, -7);
    const validFirstHalf = /^(-UU|--)(-UU|--)[-]$/;
    return validFirstHalf.test(firstHalf);
  }

  private findVerseType(pattern: string, moraCount: number): { form: VerseForm | undefined, approximate: boolean } {
    if (this.isHexameter(pattern)) {
      return { form: this.verseForms.find(form => form.formName === VerseType.Hexameter), approximate: false };
    }
    if (this.isPentameter(pattern)) {
      return { form: this.verseForms.find(form => form.formName === VerseType.Pentameter), approximate: false };
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

  private findMeterDirection(pattern: string): MetricalDirection {
    const rising = pattern.match(/U-/g)?.length || 0;
    const falling = pattern.match(/-U/g)?.length || 0;
    if (rising > falling) return MetricalDirection.Rising;
    if (falling > rising) return MetricalDirection.Falling;
    return MetricalDirection.Mixed;
  }
}
