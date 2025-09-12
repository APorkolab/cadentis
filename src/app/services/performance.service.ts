import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { debounceTime, throttleTime } from 'rxjs/operators';

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  cacheHitRatio: number;
  fps: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  size: number;
  accessCount: number;
}

export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  bufferSize: number;
  renderAhead: number;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private metricsSubject = new BehaviorSubject<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    bundleSize: 0,
    cacheHitRatio: 0,
    fps: 60,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0
  });

  // Advanced caching system
  private cache = new Map<string, CacheEntry<any>>();
  private cacheSize = 0;
  private readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
  private cacheHits = 0;
  private cacheMisses = 0;

  // Web Worker management
  private workers = new Map<string, Worker>();
  private workerQueue = new Map<string, Array<{ data: any; resolve: Function; reject: Function }>>();

  // Performance monitoring
  private performanceObserver: PerformanceObserver | null = null;
  private fpsCounter = 0;
  private lastTime = 0;

  // Virtual scrolling state
  private virtualScrollConfigs = new Map<string, VirtualScrollConfig>();

  constructor() {
    this.initializePerformanceMonitoring();
    this.startFPSMonitoring();
    this.initializeWebVitals();
  }

  // Performance Monitoring
  private initializePerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.processPerformanceEntry(entry);
        });
      });

      this.performanceObserver.observe({ 
        entryTypes: ['measure', 'navigation', 'resource', 'paint', 'largest-contentful-paint', 'layout-shift'] 
      });
    }

    // Monitor memory usage
    setInterval(() => {
      this.updateMemoryMetrics();
    }, 5000);
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    const currentMetrics = this.metricsSubject.value;
    
    switch (entry.entryType) {
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        currentMetrics.loadTime = navEntry.loadEventEnd - navEntry.fetchStart;
        currentMetrics.renderTime = navEntry.domContentLoadedEventEnd - navEntry.fetchStart;
        break;
        
      case 'largest-contentful-paint':
        currentMetrics.largestContentfulPaint = entry.startTime;
        break;
        
      case 'first-input':
        currentMetrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
        break;
        
      case 'layout-shift':
        if (!(entry as any).hadRecentInput) {
          currentMetrics.cumulativeLayoutShift += (entry as any).value;
        }
        break;
    }
    
    this.metricsSubject.next(currentMetrics);
  }

  private updateMemoryMetrics(): void {
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      const currentMetrics = this.metricsSubject.value;
      
      currentMetrics.memoryUsage = memory.usedJSHeapSize;
      currentMetrics.cacheHitRatio = this.calculateCacheHitRatio();
      
      this.metricsSubject.next(currentMetrics);
    }
  }

  private startFPSMonitoring(): void {
    const measureFPS = (timestamp: number) => {
      if (this.lastTime) {
        const delta = timestamp - this.lastTime;
        const fps = 1000 / delta;
        
        // Smooth FPS calculation
        const currentMetrics = this.metricsSubject.value;
        currentMetrics.fps = currentMetrics.fps * 0.9 + fps * 0.1;
        this.metricsSubject.next(currentMetrics);
      }
      
      this.lastTime = timestamp;
      this.fpsCounter++;
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  private initializeWebVitals(): void {
    // Core Web Vitals monitoring
    if ('web-vitals' in window) {
      // Would integrate with web-vitals library in production
      console.log('📊 Web Vitals monitoring initialized');
    }
  }

  // Advanced Caching System
  public async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.cacheMisses++;
      return null;
    }
    
    // Check TTL
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      this.cacheSize -= entry.size;
      this.cacheMisses++;
      return null;
    }
    
    // Update access count
    entry.accessCount++;
    this.cacheHits++;
    
    return entry.data;
  }

  public async set<T>(key: string, data: T, ttl: number = 300000): Promise<void> { // 5min default TTL
    const size = this.estimateSize(data);
    
    // Check if we need to evict entries
    while (this.cacheSize + size > this.MAX_CACHE_SIZE) {
      this.evictLRU();
    }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      size,
      accessCount: 1
    };
    
    this.cache.set(key, entry);
    this.cacheSize += size;
  }

  public invalidate(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.cacheSize -= entry.size;
    }
  }

  public clearCache(): void {
    this.cache.clear();
    this.cacheSize = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  private evictLRU(): void {
    let lruKey = '';
    let lruAccess = Infinity;
    let lruTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      const score = entry.accessCount + (Date.now() - entry.timestamp) / 1000;
      if (score < lruAccess + lruTime) {
        lruKey = key;
        lruAccess = entry.accessCount;
        lruTime = Date.now() - entry.timestamp;
      }
    }
    
    if (lruKey) {
      this.invalidate(lruKey);
    }
  }

  private estimateSize(data: any): number {
    // Rough estimation of object size in bytes
    const json = JSON.stringify(data);
    return new Blob([json]).size;
  }

  private calculateCacheHitRatio(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? this.cacheHits / total : 0;
  }

  // Web Worker Management
  public async executeInWorker<T>(
    workerName: string, 
    workerScript: string, 
    data: any
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let worker = this.workers.get(workerName);
      
      if (!worker) {
        worker = new Worker(workerScript);
        this.workers.set(workerName, worker);
        this.workerQueue.set(workerName, []);
        
        worker.onmessage = (event) => {
          const queue = this.workerQueue.get(workerName) || [];
          const task = queue.shift();
          
          if (task) {
            if (event.data.error) {
              task.reject(new Error(event.data.error));
            } else {
              task.resolve(event.data.result);
            }
          }
          
          // Process next task in queue
          if (queue.length > 0) {
            worker!.postMessage(queue[0].data);
          }
        };
        
        worker.onerror = (error) => {
          const queue = this.workerQueue.get(workerName) || [];
          const task = queue.shift();
          if (task) {
            task.reject(error);
          }
        };
      }
      
      const queue = this.workerQueue.get(workerName) || [];
      queue.push({ data, resolve, reject });
      
      // If worker is idle, start processing
      if (queue.length === 1) {
        worker.postMessage(data);
      }
    });
  }

  public terminateWorker(workerName: string): void {
    const worker = this.workers.get(workerName);
    if (worker) {
      worker.terminate();
      this.workers.delete(workerName);
      this.workerQueue.delete(workerName);
    }
  }

  // Virtual Scrolling Implementation
  public createVirtualScroll(
    containerId: string,
    config: VirtualScrollConfig
  ): VirtualScrollManager {
    this.virtualScrollConfigs.set(containerId, config);
    return new VirtualScrollManager(containerId, config);
  }

  // Lazy Loading Utilities
  public createLazyLoader(): LazyLoader {
    return new LazyLoader();
  }

  // Bundle Analysis
  public async analyzeBundleSize(): Promise<{ [key: string]: number }> {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const bundleAnalysis: { [key: string]: number } = {};
    
    resources.forEach(resource => {
      if (resource.name.includes('.js') || resource.name.includes('.css')) {
        const size = resource.transferSize || resource.encodedBodySize;
        const name = resource.name.split('/').pop() || 'unknown';
        bundleAnalysis[name] = size;
      }
    });
    
    return bundleAnalysis;
  }

  // Performance Profiling
  public startProfiling(name: string): void {
    performance.mark(`${name}-start`);
  }

  public endProfiling(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measures = performance.getEntriesByName(name, 'measure');
    return measures.length > 0 ? measures[measures.length - 1].duration : 0;
  }

  // Memory Pressure Detection
  public isMemoryPressure(): boolean {
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      return usageRatio > 0.8;
    }
    return false;
  }

  // Adaptive Performance
  public getAdaptiveConfig(): { quality: 'high' | 'medium' | 'low'; features: string[] } {
    const metrics = this.metricsSubject.value;
    const memoryPressure = this.isMemoryPressure();
    
    if (metrics.fps < 30 || memoryPressure || metrics.memoryUsage > 50 * 1024 * 1024) {
      return {
        quality: 'low',
        features: ['basic-analysis', 'simple-visualization']
      };
    } else if (metrics.fps < 50 || metrics.memoryUsage > 30 * 1024 * 1024) {
      return {
        quality: 'medium',
        features: ['enhanced-analysis', 'standard-visualization', 'limited-ml']
      };
    } else {
      return {
        quality: 'high',
        features: ['full-analysis', 'advanced-visualization', 'ml-analysis', 'collaboration']
      };
    }
  }

  // Observables
  public get metrics(): Observable<PerformanceMetrics> {
    return this.metricsSubject.asObservable().pipe(
      throttleTime(1000) // Throttle updates to 1Hz
    );
  }

  // Cleanup
  public dispose(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    for (const [name] of this.workers.entries()) {
      this.terminateWorker(name);
    }
    
    this.clearCache();
    console.log('🧹 Performance service disposed');
  }
}

// Virtual Scroll Manager
export class VirtualScrollManager {
  private visibleStart = 0;
  private visibleEnd = 0;
  private scrollTop = 0;
  private totalItems = 0;
  
  constructor(
    private containerId: string,
    private config: VirtualScrollConfig
  ) {}

  public updateScroll(scrollTop: number, totalItems: number): {
    visibleItems: Array<{ index: number; top: number }>;
    totalHeight: number;
  } {
    this.scrollTop = scrollTop;
    this.totalItems = totalItems;
    
    // Calculate visible range
    this.visibleStart = Math.floor(scrollTop / this.config.itemHeight);
    this.visibleEnd = Math.ceil((scrollTop + this.config.containerHeight) / this.config.itemHeight);
    
    // Add buffer
    this.visibleStart = Math.max(0, this.visibleStart - this.config.bufferSize);
    this.visibleEnd = Math.min(totalItems, this.visibleEnd + this.config.bufferSize);
    
    const visibleItems = [];
    for (let i = this.visibleStart; i < this.visibleEnd; i++) {
      visibleItems.push({
        index: i,
        top: i * this.config.itemHeight
      });
    }
    
    return {
      visibleItems,
      totalHeight: totalItems * this.config.itemHeight
    };
  }
}

// Lazy Loader
export class LazyLoader {
  private observer: IntersectionObserver;
  private loadingCallbacks = new Map<Element, () => Promise<void>>();
  
  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting) {
            const callback = this.loadingCallbacks.get(entry.target);
            if (callback) {
              await callback();
              this.unobserve(entry.target);
            }
          }
        });
      },
      {
        rootMargin: '100px' // Load 100px before entering viewport
      }
    );
  }

  public observe(element: Element, loadCallback: () => Promise<void>): void {
    this.loadingCallbacks.set(element, loadCallback);
    this.observer.observe(element);
  }

  public unobserve(element: Element): void {
    this.observer.unobserve(element);
    this.loadingCallbacks.delete(element);
  }

  public disconnect(): void {
    this.observer.disconnect();
    this.loadingCallbacks.clear();
  }
}
