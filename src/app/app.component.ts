import { Component } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { BrowserModule } from '@angular/platform-browser';
import { SyllableCounterComponent } from './components/syllable-counter/syllable-counter.component';
import { VerseAnalyzerComponent } from './components/verse-analyzer/verse-analyzer.component';
import { VerseResultComponent } from './components/verse-result/verse-result.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    BrowserModule,
    MatInputModule,
    MatFormFieldModule,
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
