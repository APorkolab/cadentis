import { Component, OnDestroy, OnInit } from '@angular/core';
import { TextParserService } from '../../services/text-parser.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { TextFieldModule } from '@angular/cdk/text-field';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, tap } from 'rxjs/operators';
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
    TextFieldModule
  ],
  templateUrl: './syllable-counter.component.html',
  styleUrls: ['./syllable-counter.component.css']
})
export class SyllableCounterComponent implements OnInit, OnDestroy {
  inputText: string = '';
  totalSyllables: number = 0;
  totalMoras: number = 0;

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
      return;
    }

    const lines = text.split('\n');
    const totals = lines.reduce((acc, line) => {
      const parsed = this.textParser.parseText(line);
      acc.syllables += parsed.syllableCount;
      acc.moras += parsed.moraCount;
      return acc;
    }, { syllables: 0, moras: 0 });

    this.totalSyllables = totals.syllables;
    this.totalMoras = totals.moras;
  }
}
