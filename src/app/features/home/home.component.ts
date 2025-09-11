import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { TextFieldModule } from '@angular/cdk/text-field';
import { TextParserService } from '../../services/text-parser.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { fadeInAnimation } from '../../animations';

@Component({
  selector: 'app-home',
  standalone: true,
  animations: [fadeInAnimation],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    TextFieldModule
  ],
  template: `
    <div class="prosody-container" @fadeIn>
      <h1 class="title">Magyar Időmértékes Prosódia – Real-time Elemzés</h1>

      <!-- Input -->
      <mat-card class="input-card">
        <mat-form-field appearance="fill" class="input-field">
          <mat-label>Írj vagy illessz be szöveget</mat-label>
          <textarea matInput
                    [(ngModel)]="inputText"
                    (ngModelChange)="onInputChange($event)"
                    cdkTextareaAutosize
                    cdkAutosizeMinRows="4"
                    cdkAutosizeMaxRows="16"
                    placeholder="Példa: Arma virumque cano, Troiae... vagy magyar szöveg"></textarea>
        </mat-form-field>
      </mat-card>

      <!-- Eredmények -->
      <div class="results" *ngIf="analysis && analysis.lines.length">
        <div class="summary">
          <mat-card class="stat-card">
            <div class="stat-value">{{ analysis.totalSyllables }}</div>
            <div class="stat-label">Szótag</div>
          </mat-card>
          <mat-card class="stat-card">
            <div class="stat-value">{{ analysis.totalMoras }}</div>
            <div class="stat-label">Mora</div>
          </mat-card>
          <mat-card class="stat-card wide">
            <div class="stat-label">Domináns ritmus</div>
            <div class="stat-value small">{{ analysis.dominantRhythm }}</div>
          </mat-card>
        </div>

        <mat-divider></mat-divider>

        <!-- Soronkénti elemzés az input alatt közvetlenül -->
        <div class="line-list">
          <mat-card class="line-card" *ngFor="let line of analysis.lines; let i = index">
            <div class="line-index">{{ i + 1 }}.</div>
            <div class="line-content">
              <div class="line-pattern">{{ line.pattern }}</div>
              <div class="line-meta">
                <span>{{ line.syllableCount }} szótag</span>
                <span>•</span>
                <span>{{ line.moraCount }} mora</span>
                <span *ngIf="line.verseForm">• {{ line.verseForm }}</span>
              </div>
              <div class="line-feet" *ngIf="line.metricFeet?.length">
                <mat-chip-listbox>
                  <mat-chip *ngFor="let foot of line.metricFeet">{{ foot }}</mat-chip>
                </mat-chip-listbox>
              </div>
            </div>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .prosody-container { padding: 24px; max-width: 1000px; margin: 0 auto; }
    .title { text-align: center; margin-bottom: 16px; }
    .input-card { margin-bottom: 12px; }
    .input-field { width: 100%; }

    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 8px 0 12px; }
    .stat-card { padding: 12px; text-align: center; }
    .stat-card.wide { grid-column: span 1; }
    .stat-value { font-size: 1.6rem; font-weight: 700; }
    .stat-value.small { font-size: 1rem; }
    .stat-label { opacity: 0.7; font-size: 0.85rem; }

    .line-list { display: flex; flex-direction: column; gap: 8px; }
    .line-card { display: grid; grid-template-columns: 32px 1fr; gap: 8px; padding: 8px 12px; }
    .line-index { font-weight: 700; opacity: 0.6; display:flex; align-items:center; }
    .line-content { display: flex; flex-direction: column; gap: 4px; }
    .line-pattern { font-family: 'Courier New', monospace; font-size: 1.1rem; }
    .line-meta { display: flex; gap: 8px; font-size: 0.9rem; opacity: 0.8; flex-wrap: wrap; }
    .line-feet { margin-top: 4px; }

    @media (max-width: 768px) {
      .summary { grid-template-columns: 1fr 1fr; }
      .stat-card.wide { grid-column: span 2; }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  inputText = '';
  analysis: any = null;
  
  private analysisSubject = new Subject<string>();
  private analysisSubscription!: Subscription;

  constructor(private textParser: TextParserService) {}

  ngOnInit(): void {
    this.analysisSubscription = this.analysisSubject.pipe(
      debounceTime(250), // Gyorsabb reakció real-time érzésért
      distinctUntilChanged(),
      tap(text => this.performAnalysis(text))
    ).subscribe();
    
    // Példa szöveg betöltése
    setTimeout(() => {
      this.inputText = 'Arma virumque cano, Troiae qui primus ab oris\nEddigi kítárt hadak közt külön vitez vala';
      this.performAnalysis(this.inputText);
    }, 500);
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
      this.analysis = null;
      return;
    }

    try {
      this.analysis = this.textParser.analyzeVerse(text);
    } catch (error) {
      console.error('Analysis error:', error);
      this.analysis = null;
    }
  }
}
