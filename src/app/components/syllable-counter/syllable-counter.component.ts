import { Component } from '@angular/core';
import { TextParserService } from '../../services/text-parser.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-syllable-counter',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule],
  templateUrl: './syllable-counter.component.html',
  styleUrl: './syllable-counter.component.css'
})
export class SyllableCounterComponent {
  syllableCount: number = 0;
  meterPattern: string = '';

  constructor(private textParser: TextParserService) { }

  onTextChange(event: Event): void {
    const inputText = (event.target as HTMLInputElement).value;
    const parsed = this.textParser.parseText(inputText);
    this.syllableCount = parsed.moraCount;
    this.meterPattern = parsed.pattern;
  }
}
