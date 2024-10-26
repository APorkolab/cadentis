import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { SyllableCounterComponent } from './components/syllable-counter/syllable-counter.component';
import { VerseAnalyzerComponent } from './components/verse-analyzer/verse-analyzer.component';
import { VerseResultComponent } from './components/verse-result/verse-result.component';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    MatButtonModule,
    SyllableCounterComponent,
    VerseAnalyzerComponent,
    VerseResultComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'cadentis';
}
