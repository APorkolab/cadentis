import { Injectable, inject } from '@angular/core';
import { TextParserService } from './text-parser.service';
import { RhymeAnalyzerService } from './rhyme-analyzer.service';
import { VerseFormService } from './verse-form.service';
import { WebWorkerManagerService } from './web-worker-manager.service';
import { CacheService } from './cache.service';
import { PerformanceMonitorService } from './performance-monitor.service';
import { VerseLine } from '../models/verse-line.model';
import { VerseForm } from '../models/verse-form.model';
import { MetricalDirection, VerseType } from '../models/verse.enums';
import { Observable, of, forkJoin, BehaviorSubject, from } from 'rxjs';
import { map, catchError, tap, switchMap, mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VerseAnalysisService {
  private verseForms: VerseForm[] = [];
  private readonly textParser = inject(TextParserService);
  private readonly rhymeAnalyzer = inject(RhymeAnalyzerService);
  private readonly verseFormService = inject(VerseFormService);
  private readonly webWorkerManager = inject(WebWorkerManagerService);
  private readonly cache = inject(CacheService);
  private readonly performanceMonitor = inject(PerformanceMonitorService);
  
  private readonly LARGE_TEXT_THRESHOLD = 5000; // characters
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour

  private analysisProgressSubject = new BehaviorSubject<{
    isAnalyzing: boolean;
    progress: number;
    currentLine: number;
    totalLines: number;
    error?: string;
  }>({
    isAnalyzing: false,
    progress: 0,
    currentLine: 0,
    totalLines: 0
  });

  public analysisProgress$ = this.analysisProgressSubject.asObservable();

  constructor() {
    // Safe initialization - only subscribe if verseFormService exists
    if (this.verseFormService && this.verseFormService.getVerseForms) {
      this.verseFormService.getVerseForms().subscribe({
        next: forms => {
          this.verseForms = forms;
        },
        error: () => {
          this.verseForms = []; // Fallback to empty array
        }
      });
    } else {
      this.verseForms = []; // Fallback if service not available
    }
  }

  public analyze(text: string): Observable<VerseLine[]> {
    const taskId = `analysis_${Date.now()}`;
    const cacheKey = this.cache.generateCacheKey('verse-analysis', text);

    // Start performance monitoring
    this.performanceMonitor.startTask(taskId, 'verse-analysis', text);

    // Update analysis progress
    this.updateProgress(true, 0, 0, text.split('\n').length);

    return this.getCachedOrAnalyze(cacheKey, text, taskId);
  }

  private getCachedOrAnalyze(cacheKey: string, text: string, taskId: string): Observable<VerseLine[]> {
    return from(this.cache.get<VerseLine[]>(cacheKey)).pipe(
      switchMap(cachedResult => {
        if (cachedResult) {
          this.performanceMonitor.completeTask(taskId);
          this.updateProgress(false, 100, 0, 0);
          return of(cachedResult);
        }

        // Decide whether to use web worker or fallback
        return text.length > this.LARGE_TEXT_THRESHOLD
          ? this.analyzeWithWebWorker(text, taskId, cacheKey)
          : this.analyzeSync(text, taskId, cacheKey);
      }),
      catchError(error => {
        console.error('Analysis failed:', error);
        this.performanceMonitor.completeTask(taskId);
        this.updateProgress(false, 0, 0, 0, error.message);
        return this.analyzeSync(text, taskId, cacheKey); // Fallback to sync
      })
    );
  }

  private analyzeWithWebWorker(text: string, taskId: string, cacheKey: string): Observable<VerseLine[]> {
    const results: VerseLine[] = [];
    let totalChunks = 0;
    let processedChunks = 0;

    return this.webWorkerManager.analyzeVerse(text).pipe(
      tap(response => {
        if (response.isPartial) {
          // Handle partial results from worker
          const chunkResults = this.processWorkerResult(response.result);
          results.push(...chunkResults);
          
          processedChunks++;
          totalChunks = response.totalChunks || 1;
          
          const progress = (processedChunks / totalChunks) * 70; // Reserve 30% for rhyme analysis
          this.updateProgress(true, progress, processedChunks, totalChunks);
        }
      }),
      switchMap(() => {
        // Perform rhyme analysis on combined results
        this.updateProgress(true, 70, 0, 0);
        return this.performRhymeAnalysis(results.map(r => r.text));
      }),
      map(rhymeAnalysis => {
        // Combine results with rhyme analysis
        const finalResults = this.combineWithRhymeAnalysis(results, rhymeAnalysis);
        
        // Cache the result
        this.cache.set(cacheKey, finalResults, this.CACHE_TTL, 'verse-analysis');
        
        this.performanceMonitor.completeTask(taskId);
        this.updateProgress(false, 100, 0, 0);
        
        return finalResults;
      }),
      catchError(error => {
        console.error('Web worker analysis failed:', error);
        return this.analyzeSync(text, taskId, cacheKey);
      })
    );
  }

  public analyzeSync(text: string, taskId: string, cacheKey: string): Observable<VerseLine[]> {
    return new Observable<VerseLine[]>(observer => {
      try {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        this.updateProgress(true, 0, 0, lines.length);

        const matchedLines = lines.map((line, index) => {
          const { pattern, syllableCount, moraCount } = this.textParser.parseText(line);
          const { form, approximate } = this.findVerseType(pattern);
          const substitutions: string[] = this.findSubstitutions(pattern, form);
          const lejtesirany = this.findMeterDirection(pattern);

          let formName: string = form ? form.formName : VerseType.Unknown;
          if (approximate && form) formName = `~${form.formName}`;
          if (form && !approximate) formName = `+${form.formName}`;

          const verseLine = new VerseLine();
          verseLine.meterPattern = pattern;
          verseLine.syllableCount = syllableCount;
          verseLine.moraCount = moraCount;
          verseLine.verseType = formName;
          verseLine.text = line;
          verseLine.substitutions = substitutions;
          verseLine.lejtesirany = lejtesirany;
          
          // Update progress
          const progress = (index / lines.length) * 70;
          this.updateProgress(true, progress, index + 1, lines.length);
          
          return verseLine;
        });

        // Rhyme analysis
        this.updateProgress(true, 70, 0, 0);
        const rhymeResult = this.rhymeAnalyzer.analyzeRhyme(lines);
        const rhymePattern = rhymeResult && Array.isArray(rhymeResult.pattern) ? rhymeResult.pattern : [];

        const finalResults = matchedLines.map((line, index) => {
          line.rhymeScheme = rhymePattern[index] || '';
          return line;
        });

        // Distichon detection
        this.updateProgress(true, 90, 0, 0);
        for (let i = 0; i < finalResults.length - 1; i += 2) {
          const currentLine = finalResults[i];
          const nextLine = finalResults[i + 1];

          if (this.isHexameter(currentLine.meterPattern) && this.isPentameter(nextLine.meterPattern)) {
            currentLine.verseType = VerseType.DistichonHexameter;
            nextLine.verseType = VerseType.DistichonPentameter;
            currentLine.isDisztichonPart = true;
            nextLine.isDisztichonPart = true;
          }
        }

        // Cache the result
        this.cache.set(cacheKey, finalResults, this.CACHE_TTL, 'verse-analysis');
        
        this.performanceMonitor.completeTask(taskId);
        this.updateProgress(false, 100, 0, 0);
        
        observer.next(finalResults);
        observer.complete();
      } catch (error) {
        this.performanceMonitor.completeTask(taskId);
        this.updateProgress(false, 0, 0, 0, (error as Error).message);
        observer.error(error);
      }
    });
  }

  private isHexameter(pattern: string): boolean {
    const mainPattern = pattern.replace(/[x?\s]/g, '');
    if (!/^[-U]+$/.test(mainPattern)) return false;
    const n = mainPattern.length;
    if (n < 12 || n > 20) return false;
    const hasDactyl = mainPattern.includes('-UU');
    if (!hasDactyl) return false;
    const lastFootOk = mainPattern.endsWith('--') || mainPattern.endsWith('-U');
    if (!lastFootOk) return false;
    const tail = mainPattern.slice(Math.max(0, n - 7));
    if (!tail.includes('-UU')) return false;
    return true;
  }

  private isPentameter(pattern: string): boolean {
    const mainPattern = pattern.replace(/[x?\s]/g, '');
    if (!/^[-U]+$/.test(mainPattern)) return false;
    const n = mainPattern.length;
    if (n < 10 || n > 16) return false;
    const dactyls = (mainPattern.match(/-UU/g) || []).length;
    if (dactyls < 2) return false;
    if (!(mainPattern.endsWith('-') || mainPattern.endsWith('--'))) return false;
    return true;
  }

  private findVerseType(pattern: string): { form: VerseForm | undefined, approximate: boolean } {
    if (this.isHexameter(pattern)) {
      return { form: this.verseForms.find(form => form.formName === VerseType.Hexameter), approximate: false };
    }
    if (this.isPentameter(pattern)) {
      return { form: this.verseForms.find(form => form.formName === VerseType.Pentameter), approximate: false };
    }

    let bestMatch: VerseForm | undefined;
    let bestSimilarity = 0;
    this.verseForms.forEach(form => {
      const similarity = this.patternSimilarity(pattern, form.pattern);
      if (similarity > bestSimilarity) {
        bestMatch = form;
        bestSimilarity = similarity;
      }
    });

    return {
      form: bestMatch,
      approximate: bestMatch ? bestSimilarity < 1 : false
    };
  }

  private patternSimilarity(pattern1: string, pattern2: string): number {
    const minLength = Math.min(pattern1.length, pattern2.length);
    let matches = 0;
    for (let i = 0; i < minLength; i++) {
      if (pattern1[i] === pattern2[i]) matches++;
    }
    return matches / Math.max(pattern1.length, pattern2.length);
  }

  private findSubstitutions(pattern: string, verseType: VerseForm | undefined): string[] {
    if (!verseType) return [];
    const substitutions: string[] = [];
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] !== verseType.pattern[i]) {
        substitutions.push(`${pattern[i] === '-' ? 'Long' : 'Short'} instead of ${verseType.pattern[i] === '-' ? 'long' : 'short'} at position ${i + 1}`);
      }
    }
    return substitutions;
  }

  private findMeterDirection(pattern: string): MetricalDirection {
    const rising = pattern.match(/U-/g)?.length || 0;
    const falling = pattern.match(/-U/g)?.length || 0;
    if (rising > falling) return MetricalDirection.Rising;
    if (falling > rising) return MetricalDirection.Falling;
    return MetricalDirection.Mixed;
  }

  // Helper methods for enhanced analysis
  private updateProgress(isAnalyzing: boolean, progress: number, currentLine: number, totalLines: number, error?: string): void {
    this.analysisProgressSubject.next({
      isAnalyzing,
      progress: Math.min(100, Math.max(0, progress)),
      currentLine,
      totalLines,
      error
    });
  }

  private processWorkerResult(workerResult: any): VerseLine[] {
    return workerResult.map((lineData: any) => {
      const verseLine = new VerseLine();
      verseLine.text = lineData.text;
      verseLine.meterPattern = lineData.pattern;
      verseLine.syllableCount = lineData.syllableCount;
      verseLine.moraCount = lineData.moraCount;
      
      // Additional properties from worker analysis
      if (lineData.stressPattern) {
        verseLine.substitutions = [`Stress pattern: ${lineData.stressPattern}`];
      }
      if (lineData.caesuraPosition !== null) {
        verseLine.substitutions = [...(verseLine.substitutions || []), `Caesura at position ${lineData.caesuraPosition}`];
      }
      if (lineData.complexity !== undefined) {
        verseLine.substitutions = [...(verseLine.substitutions || []), `Complexity score: ${lineData.complexity.toFixed(2)}`];
      }
      
      // Determine verse type
      const { form, approximate } = this.findVerseType(verseLine.meterPattern);
      let formName: string = form ? form.formName : VerseType.Unknown;
      if (approximate && form) formName = `~${form.formName}`;
      if (form && !approximate) formName = `+${form.formName}`;
      verseLine.verseType = formName;
      
      verseLine.lejtesirany = this.findMeterDirection(verseLine.meterPattern);
      
      return verseLine;
    });
  }

  private performRhymeAnalysis(lines: string[]): Observable<any> {
    return new Observable(observer => {
      try {
        const rhymeAnalysis = this.rhymeAnalyzer.analyzeRhyme(lines);
        observer.next(rhymeAnalysis);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  private combineWithRhymeAnalysis(verseLines: VerseLine[], rhymeAnalysis: any): VerseLine[] {
    return verseLines.map((line, index) => {
      line.rhymeScheme = rhymeAnalysis.pattern[index] || '';
      return line;
    });
  }

  // Advanced analysis methods
  public getAnalysisStats(verseLines: VerseLine[]): {
    totalLines: number;
    averageLineLength: number;
    meterVariety: number;
    rhymeComplexity: number;
    mostCommonMeter: string;
    estimatedComplexity: number;
  } {
    if (!verseLines.length) {
      return {
        totalLines: 0,
        averageLineLength: 0,
        meterVariety: 0,
        rhymeComplexity: 0,
        mostCommonMeter: 'Unknown',
        estimatedComplexity: 0
      };
    }

    const totalLines = verseLines.length;
    const averageLineLength = verseLines.reduce((sum, line) => sum + line.text.length, 0) / totalLines;
    
    const meterPatterns = verseLines.map(line => line.meterPattern);
    const uniqueMeters = new Set(meterPatterns);
    const meterVariety = uniqueMeters.size;
    
    const rhymeSchemes = verseLines.map(line => line.rhymeScheme).filter(scheme => scheme !== 'x' && scheme !== '');
    const uniqueRhymes = new Set(rhymeSchemes);
    const rhymeComplexity = rhymeSchemes.length > 0 ? uniqueRhymes.size / rhymeSchemes.length : 0;
    
    // Find most common meter
    const meterCounts = new Map<string, number>();
    meterPatterns.forEach(pattern => {
      meterCounts.set(pattern, (meterCounts.get(pattern) || 0) + 1);
    });
    const mostCommonMeter = Array.from(meterCounts.entries())
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Unknown';
    
    // Estimate overall complexity
    const estimatedComplexity = (meterVariety * 0.3) + (rhymeComplexity * 0.4) + (averageLineLength / 50 * 0.3);
    
    return {
      totalLines,
      averageLineLength,
      meterVariety,
      rhymeComplexity,
      mostCommonMeter,
      estimatedComplexity
    };
  }

  public exportAnalysis(verseLines: VerseLine[]): string {
    const stats = this.getAnalysisStats(verseLines);
    
    return JSON.stringify({
      metadata: {
        timestamp: new Date().toISOString(),
        version: '2.0',
        totalLines: stats.totalLines
      },
      statistics: stats,
      analysis: verseLines,
      summary: {
        meterDistribution: this.getMeterDistribution(verseLines),
        rhymeSchemeAnalysis: this.getRhymeSchemeAnalysis(verseLines)
      }
    }, null, 2);
  }

  private getMeterDistribution(verseLines: VerseLine[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    verseLines.forEach(line => {
      const pattern = line.meterPattern;
      distribution[pattern] = (distribution[pattern] || 0) + 1;
    });
    
    return distribution;
  }

  private getRhymeSchemeAnalysis(verseLines: VerseLine[]): {
    pattern: string;
    complexity: number;
    type: string;
  } {
    const schemes = verseLines.map(line => line.rhymeScheme).filter(s => s && s !== 'x');
    const pattern = schemes.join('');
    const uniqueSchemes = new Set(schemes);
    const complexity = schemes.length > 0 ? uniqueSchemes.size / schemes.length : 0;
    
    let type = 'Unknown';
    if (pattern.length === 4) {
      if (pattern === 'abab') type = 'Alternate rhyme';
      else if (pattern === 'abba') type = 'Enclosed rhyme';
      else if (pattern === 'aabb') type = 'Coupled rhyme';
      else if (pattern === 'aaaa') type = 'Monorhyme';
    }
    
    return { pattern, complexity, type };
  }
}
