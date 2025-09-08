import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { SyllableCounterComponent } from './components/syllable-counter/syllable-counter.component';

import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { VerseAnalyzerComponent } from './components/verse-analyzer/verse-analyzer.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    MatButtonModule,
    SyllableCounterComponent,
    VerseAnalyzerComponent,
    MatSnackBarModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Cadentis';
}
