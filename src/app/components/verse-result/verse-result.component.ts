import { Component, Input } from '@angular/core';
import { VerseLine } from '../../models/verse-line.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verse-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verse-result.component.html',
  styleUrls: ['./verse-result.component.css']
})
export class VerseResultComponent {
  @Input() verseLines: VerseLine[] = [];
  @Input() rhymePattern: string[] = [];
}
