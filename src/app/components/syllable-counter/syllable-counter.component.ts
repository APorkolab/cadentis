import { Component } from '@angular/core';
import { TextParserService } from '../../services/text-parser.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

interface AnalyzedLine {
  pattern: string;
  syllableCount: number;
  moraCount: number;
}

@Component({
  selector: 'app-syllable-counter',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule],
  templateUrl: './syllable-counter.component.html',
  styleUrls: ['./syllable-counter.component.css']
})
export class SyllableCounterComponent {
  analyzedLines: AnalyzedLine[] = [];

  constructor(private textParser: TextParserService) { }

  analyzeVerse(event: Event): void {
    const inputText = (event.target as HTMLTextAreaElement).value;
    const lines = inputText.split('\n').filter(line => line.trim()); // Feldaraboljuk a sorokat

    this.analyzedLines = lines.map(line => {
      const parsed = this.textParser.parseText(line);
      return {
        pattern: parsed.pattern,
        syllableCount: parsed.syllableCount,
        moraCount: parsed.moraCount
      };
    });
  }
}
