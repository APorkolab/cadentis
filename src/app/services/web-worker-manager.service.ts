import { Injectable, inject } from '@angular/core';
import { Observable, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';

interface AnalysisRequest {
  id: string;
  text: string;
  type: 'syllable-count' | 'verse-analysis' | 'rhyme-analysis';
  chunkIndex?: number;
  totalChunks?: number;
}

interface AnalysisResponse {
  id: string;
  result: any;
  error?: string;
  chunkIndex?: number;
  totalChunks?: number;
  processingTime: number;
}

interface WorkerTask {
  id: string;
  type: string;
  subject: Subject<any>;
  startTime: number;
  chunks?: number;
  completedChunks?: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebWorkerManagerService {
  private worker: Worker | null = null;
  private tasks = new Map<string, WorkerTask>();
  private activeTasksSubject = new BehaviorSubject<number>(0);
  private isInitialized = false;
  private readonly CHUNK_SIZE = 10000; // characters per chunk
  private readonly MAX_CONCURRENT_TASKS = 3;

  public activeTasks$ = this.activeTasksSubject.asObservable();

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker(): void {
    if (typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(new URL('../workers/text-analysis.worker', import.meta.url));
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
        this.worker.onerror = this.handleWorkerError.bind(this);
        this.isInitialized = true;
      } catch (error) {
        console.warn('Web Worker not supported or failed to initialize:', error);
        this.isInitialized = false;
      }
    } else {
      console.warn('Web Workers are not supported in this environment');
      this.isInitialized = false;
    }
  }

  private handleWorkerMessage(event: MessageEvent<AnalysisResponse>): void {
    const { id, result, error, chunkIndex, totalChunks, processingTime } = event.data;
    const task = this.tasks.get(id);

    if (!task) {
      console.warn(`Received response for unknown task: ${id}`);
      return;
    }

    if (error) {
      task.subject.error(new Error(error));
      this.cleanupTask(id);
      return;
    }

    if (totalChunks && totalChunks > 1) {
      // Handle chunked processing
      this.handleChunkedResponse(task, result, chunkIndex!, totalChunks);
    } else {
      // Single response
      task.subject.next({
        result,
        processingTime,
        totalTime: performance.now() - task.startTime
      });
      task.subject.complete();
      this.cleanupTask(id);
    }
  }

  private handleChunkedResponse(task: WorkerTask, result: any, chunkIndex: number, totalChunks: number): void {
    task.completedChunks = (task.completedChunks || 0) + 1;
    
    // Store chunk result (implementation depends on analysis type)
    task.subject.next({
      result,
      chunkIndex,
      totalChunks,
      isPartial: true,
      progress: task.completedChunks / totalChunks
    });

    if (task.completedChunks === totalChunks) {
      task.subject.complete();
      this.cleanupTask(task.id);
    }
  }

  private handleWorkerError(error: ErrorEvent): void {
    console.error('Web Worker error:', error);
    // Notify all active tasks of the error
    this.tasks.forEach(task => {
      task.subject.error(new Error('Web Worker error: ' + error.message));
    });
    this.tasks.clear();
    this.updateActiveTasksCount();
  }

  private cleanupTask(taskId: string): void {
    this.tasks.delete(taskId);
    this.updateActiveTasksCount();
  }

  private updateActiveTasksCount(): void {
    this.activeTasksSubject.next(this.tasks.size);
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldUseChunking(text: string): boolean {
    return text.length > this.CHUNK_SIZE;
  }

  private createChunks(text: string): string[] {
    if (!this.shouldUseChunking(text)) {
      return [text];
    }

    const chunks: string[] = [];
    const lines = text.split('\n');
    let currentChunk = '';
    
    for (const line of lines) {
      if (currentChunk.length + line.length + 1 > this.CHUNK_SIZE && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = line;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  public analyzeSyllables(text: string): Observable<any> {
    return this.performAnalysis(text, 'syllable-count');
  }

  public analyzeVerse(text: string): Observable<any> {
    return this.performAnalysis(text, 'verse-analysis');
  }

  public analyzeRhyme(text: string): Observable<any> {
    return this.performAnalysis(text, 'rhyme-analysis');
  }

  private performAnalysis(text: string, type: 'syllable-count' | 'verse-analysis' | 'rhyme-analysis'): Observable<any> {
    if (!this.isInitialized || !this.worker) {
      // Fallback to synchronous processing
      return new Observable(observer => {
        observer.error(new Error('Web Worker not available. Please use fallback processing.'));
      });
    }

    if (this.tasks.size >= this.MAX_CONCURRENT_TASKS) {
      return new Observable(observer => {
        observer.error(new Error('Too many concurrent tasks. Please wait and try again.'));
      });
    }

    const taskId = this.generateTaskId();
    const subject = new Subject<any>();
    const chunks = this.createChunks(text);
    
    const task: WorkerTask = {
      id: taskId,
      type,
      subject,
      startTime: performance.now(),
      chunks: chunks.length,
      completedChunks: 0
    };

    this.tasks.set(taskId, task);
    this.updateActiveTasksCount();

    // Send chunks to worker
    chunks.forEach((chunk, index) => {
      const request: AnalysisRequest = {
        id: taskId,
        text: chunk,
        type,
        chunkIndex: index,
        totalChunks: chunks.length
      };

      this.worker!.postMessage(request);
    });

    return subject.asObservable();
  }

  public getPerformanceMetrics(): Observable<{
    activeTasks: number;
    isWorkerAvailable: boolean;
    maxConcurrentTasks: number;
  }> {
    return this.activeTasks$.pipe(
      map(activeTasks => ({
        activeTasks,
        isWorkerAvailable: this.isInitialized,
        maxConcurrentTasks: this.MAX_CONCURRENT_TASKS
      }))
    );
  }

  public terminateWorker(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
    
    // Clean up tasks
    this.tasks.forEach(task => {
      task.subject.error(new Error('Worker terminated'));
    });
    this.tasks.clear();
    this.updateActiveTasksCount();
  }

  ngOnDestroy(): void {
    this.terminateWorker();
  }
}
