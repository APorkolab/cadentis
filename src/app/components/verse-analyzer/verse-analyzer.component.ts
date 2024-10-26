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
  verseForms: VerseForm[] = [];    // Típus helyesbítve VerseForm[]-re
  matchedLines: VerseLine[] = [];
  rhymePattern: string = '';

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
      const parsedPattern = this.textParser.parseText(line).pattern;
      const syllableCount = parsedPattern.split('-').length + parsedPattern.split('U').length - 1;
      const verseType = this.findVerseType(parsedPattern);

      return {
        meterPattern: parsedPattern,
        syllableCount,
        verseType: verseType ? verseType : 'ismeretlen forma',
        text: line,
        rhymeScheme: ''  // Ezt a VerseResultComponent-nek adjuk át
      };
    });

    this.rhymePattern = this.rhymeAnalyzer.analyzeRhyme(lines);
  }

  findVerseType(pattern: string): string | null {
    const matchedForm = this.verseForms.find(form => form.pattern === pattern);
    return matchedForm ? matchedForm.formName : null;
  }
}
