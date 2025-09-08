import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { VerseAnalysisService } from '../../services/verse-analysis.service';
import { WebWorkerManagerService } from '../../services/web-worker-manager.service';
import { PerformanceMonitorService } from '../../services/performance-monitor.service';
import { VerseLine } from '../../models/verse-line.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, Subscription, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap, switchMap, takeUntil, catchError } from 'rxjs/operators';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatTableModule } from '@angular/material/table';
import { fadeInAnimation } from '../../animations';
import { of, Observable } from 'rxjs';

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
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TextFieldModule,
    MatTableModule
  ],
  templateUrl: './verse-analyzer.component.html',
  styleUrls: ['./verse-analyzer.component.css']
})
export class VerseAnalyzerComponent implements OnInit, OnDestroy {
  inputText = '';
  matchedLines: VerseLine[] = [];
  isLoading = false;
  analysisProgress = 0;
  analysisStats: any = null;
  performanceMetrics: any = null;
  errorMessage = '';
  
  displayedColumns: string[] = ['meterPattern', 'rhymeScheme', 'syllableCount', 'moraCount', 'verseType', 'text', 'lejtesirany'];

  private readonly verseAnalysisService = inject(VerseAnalysisService);
  private readonly webWorkerManager = inject(WebWorkerManagerService);
  private readonly performanceMonitor = inject(PerformanceMonitorService);
  
  private analysisSubject = new Subject<string>();
  private analysisSubscription!: Subscription;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.setupAnalysisStream();
    this.subscribeToProgress();
    this.subscribeToPerformanceMetrics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.analysisSubscription) {
      this.analysisSubscription.unsubscribe();
    }
  }

  private setupAnalysisStream(): void {
    this.analysisSubscription = this.analysisSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      tap(() => {
        this.isLoading = true;
        this.errorMessage = '';
        this.analysisProgress = 0;
      }),
      switchMap(text => this.performAnalysis(text)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result: VerseLine[]) => {
        this.matchedLines = result;
        this.analysisStats = this.verseAnalysisService.getAnalysisStats(result);
        this.isLoading = false;
        this.analysisProgress = 100;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Analysis failed';
        this.isLoading = false;
        this.analysisProgress = 0;
        console.error('Analysis error:', error);
      }
    });
  }

  private subscribeToProgress(): void {
    this.verseAnalysisService.analysisProgress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        this.analysisProgress = progress.progress;
        this.isLoading = progress.isAnalyzing;
        if (progress.error) {
          this.errorMessage = progress.error;
        }
      });
  }

  private subscribeToPerformanceMetrics(): void {
    this.performanceMonitor.metrics$
      .pipe(takeUntil(this.destroy$))
      .subscribe(metrics => {
        this.performanceMetrics = metrics;
      });
  }

  onInputChange(text: string): void {
    this.analysisSubject.next(text);
  }

  private performAnalysis(text: string): Observable<VerseLine[]> {
    if (!text || text.trim() === '') {
      this.matchedLines = [];
      this.analysisStats = null;
      return of([]);
    }
    
    return this.verseAnalysisService.analyze(text).pipe(
      catchError(error => {
        console.error('Analysis failed:', error);
        this.errorMessage = error.message || 'Analysis failed';
        return of([]);
      })
    );
  }

  exportAnalysis(): void {
    if (this.matchedLines.length > 0) {
      const exportData = this.verseAnalysisService.exportAnalysis(this.matchedLines);
      this.downloadFile(exportData, 'verse-analysis.json', 'application/json');
    }
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    });
  }

  getComplexityColor(complexity: number): string {
    if (complexity < 1) return 'primary';
    if (complexity < 3) return 'accent';
    return 'warn';
  }

  formatProcessingRate(rate: number): string {
    if (rate < 1000) return `${rate.toFixed(0)} chars/s`;
    if (rate < 1000000) return `${(rate / 1000).toFixed(1)}K chars/s`;
    return `${(rate / 1000000).toFixed(1)}M chars/s`;
  }

  formatMemoryUsage(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  }

  retryAnalysis(): void {
    if (this.inputText) {
      this.errorMessage = '';
      this.analysisSubject.next(this.inputText);
    }
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
