import { Component, OnDestroy, OnInit } from '@angular/core';
import { TextParserService } from '../../services/text-parser.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { fadeInAnimation } from '../../animations';

@Component({
  selector: 'app-syllable-counter',
  standalone: true,
  animations: [fadeInAnimation],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    TextFieldModule,
    MatButtonModule,
    MatExpansionModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule
  ],
  templateUrl: './syllable-counter.component.html',
  styleUrls: ['./syllable-counter.component.css']
})
export class SyllableCounterComponent implements OnInit, OnDestroy {
  inputText = '';
  totalSyllables = 0;
  totalMoras = 0;
  verseAnalysis: any = null;
  showDetailedAnalysis = false;

  private analysisSubject = new Subject<string>();
  private analysisSubscription!: Subscription;

  constructor(private textParser: TextParserService) { }

  ngOnInit(): void {
    this.analysisSubscription = this.analysisSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(text => this.performAnalysis(text))
    ).subscribe();
  }

  ngOnDestroy(): void {
    if (this.analysisSubscription) {
      this.analysisSubscription.unsubscribe();
    }
  }

  onInputChange(text: string): void {
    this.analysisSubject.next(text);
  }

  private performAnalysis(text: string): void {
    if (!text || text.trim() === '') {
      this.totalSyllables = 0;
      this.totalMoras = 0;
      this.verseAnalysis = null;
      return;
    }

    // Kibővített vers elemés
    this.verseAnalysis = this.textParser.analyzeVerse(text);
    this.totalSyllables = this.verseAnalysis.totalSyllables;
    this.totalMoras = this.verseAnalysis.totalMoras;
  }

  toggleDetailedAnalysis(): void {
    this.showDetailedAnalysis = !this.showDetailedAnalysis;
  }
}
