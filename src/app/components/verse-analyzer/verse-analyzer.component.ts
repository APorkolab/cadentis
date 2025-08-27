import { Component, OnDestroy, OnInit } from '@angular/core';
import { VerseAnalysisService } from '../../services/verse-analysis.service';
import { VerseLine } from '../../models/verse-line.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatTableModule } from '@angular/material/table';
import { fadeInAnimation } from '../../animations';

@Component({
  selector: 'app-verse-analyzer',
  standalone: true,
  animations: [fadeInAnimation],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatProgressBarModule,
    TextFieldModule,
    MatTableModule
  ],
  templateUrl: './verse-analyzer.component.html',
  styleUrls: ['./verse-analyzer.component.css']
})
export class VerseAnalyzerComponent implements OnInit, OnDestroy {
  inputText: string = '';
  matchedLines: VerseLine[] = [];
  isLoading: boolean = false;
  displayedColumns: string[] = ['meterPattern', 'rhymeScheme', 'syllableCount', 'moraCount', 'verseType', 'text', 'lejtesirany'];

  private analysisSubject = new Subject<string>();
  private analysisSubscription!: Subscription;

  constructor(private verseAnalysisService: VerseAnalysisService) { }

  ngOnInit(): void {
    this.analysisSubscription = this.analysisSubject.pipe(
      tap(() => this.isLoading = true),
      debounceTime(500),
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
      this.matchedLines = [];
      this.isLoading = false;
      return;
    }
    this.matchedLines = this.verseAnalysisService.analyze(text);
    this.isLoading = false;
  }
}
