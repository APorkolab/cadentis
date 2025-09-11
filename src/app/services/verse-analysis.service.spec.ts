import { TestBed } from '@angular/core/testing';
import { VerseAnalysisService } from './verse-analysis.service';
import { TextParserService } from './text-parser.service';
import { RhymeAnalyzerService } from './rhyme-analyzer.service';
import { VerseFormService } from './verse-form.service';
import { WebWorkerManagerService } from './web-worker-manager.service';
import { CacheService } from './cache.service';
import { PerformanceMonitorService } from './performance-monitor.service';
import { of, EMPTY } from 'rxjs';
import { MetricalDirection, VerseType } from '../models/verse.enums';
import { VerseForm } from '../models/verse-form.model';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('VerseAnalysisService', () => {
  let service: VerseAnalysisService;
  let textParserSpy: jasmine.SpyObj<TextParserService>;
  let rhymeAnalyzerSpy: jasmine.SpyObj<RhymeAnalyzerService>;
  let verseFormSpy: jasmine.SpyObj<VerseFormService>;
  let webWorkerManagerSpy: jasmine.SpyObj<WebWorkerManagerService>;
  let cacheSpy: jasmine.SpyObj<CacheService>;
  let performanceMonitorSpy: jasmine.SpyObj<PerformanceMonitorService>;

  const mockVerseForms: VerseForm[] = [
    { formName: VerseType.Hexameter, pattern: '(-UU|-UU|-UU|-UU|-UU|--)', moraCount: 24, category: 'Sorfajták' },
    { formName: VerseType.Pentameter, pattern: '(-UU|-UU-| -UU|-UU|-)', moraCount: 20, category: 'Sorfajták' }
  ];

  beforeEach(async () => {
    const textSpy = jasmine.createSpyObj('TextParserService', ['parseText']);
    const rhymeSpy = jasmine.createSpyObj('RhymeAnalyzerService', ['analyzeRhyme']);
    const formSpy = jasmine.createSpyObj('VerseFormService', ['getVerseForms']);
    const workerSpy = jasmine.createSpyObj('WebWorkerManagerService', ['analyzeVerse', 'getPerformanceMetrics']);
    const cacheSpyObj = jasmine.createSpyObj('CacheService', ['get', 'set', 'generateCacheKey']);
    const perfSpy = jasmine.createSpyObj('PerformanceMonitorService', ['startTask', 'completeTask']);

    // Setup all spy return values BEFORE TestBed configuration
    formSpy.getVerseForms.and.returnValue(of(mockVerseForms));
    cacheSpyObj.get.and.returnValue(Promise.resolve(null));
    cacheSpyObj.set.and.returnValue(Promise.resolve());
    cacheSpyObj.generateCacheKey.and.returnValue('test-key');
    workerSpy.getPerformanceMetrics.and.returnValue(of({ activeTasks: 0, isWorkerAvailable: false, maxConcurrentTasks: 3 }));
    perfSpy.startTask.and.returnValue();
    perfSpy.completeTask.and.returnValue();
    
    // Setup observable properties
    Object.defineProperty(perfSpy, 'metrics$', {
      value: of({ memoryUsage: 1024, activeTasks: 0, completedTasks: 0, averageTaskTime: 0, processingRate: 100 }),
      configurable: true
    });

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: TextParserService, useValue: textSpy },
        { provide: RhymeAnalyzerService, useValue: rhymeSpy },
        { provide: VerseFormService, useValue: formSpy },
        { provide: WebWorkerManagerService, useValue: workerSpy },
        { provide: CacheService, useValue: cacheSpyObj },
        { provide: PerformanceMonitorService, useValue: perfSpy },
        VerseAnalysisService
      ],
    }).compileComponents();

    service = TestBed.inject(VerseAnalysisService);
    textParserSpy = TestBed.inject(TextParserService) as jasmine.SpyObj<TextParserService>;
    rhymeAnalyzerSpy = TestBed.inject(RhymeAnalyzerService) as jasmine.SpyObj<RhymeAnalyzerService>;
    verseFormSpy = TestBed.inject(VerseFormService) as jasmine.SpyObj<VerseFormService>;
    webWorkerManagerSpy = TestBed.inject(WebWorkerManagerService) as jasmine.SpyObj<WebWorkerManagerService>;
    cacheSpy = TestBed.inject(CacheService) as jasmine.SpyObj<CacheService>;
    performanceMonitorSpy = TestBed.inject(PerformanceMonitorService) as jasmine.SpyObj<PerformanceMonitorService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should analyze a single line and identify it as hexameter', (done) => {
    const text = 'Arma virumque cano, Troiae qui primus ab oris';
    const pattern = '-UU-UU-UU-UU-UU--';
    
    textParserSpy.parseText.and.returnValue({
      pattern: pattern, 
      syllableCount: 17, 
      moraCount: 24,
      metricFeet: ['Daktylus', 'Daktylus', 'Daktylus', 'Daktylus', 'Daktylus', 'Spondeus'],
      rhythm: 'Daktilikus ritmus',
      verseForm: 'Klasszikus hexameter'
    });
    rhymeAnalyzerSpy.analyzeRhyme.and.returnValue({ pattern: ['a'], rhymeType: 'single' });

    service.analyze(text).subscribe({
      next: result => {
        expect(result.length).toBe(1);
        expect(result[0].text).toBe(text);
        expect(result[0].meterPattern).toBe(pattern);
        done();
      },
      error: err => {
        fail('Should not error: ' + err);
        done();
      }
    });
  });

  it('should correctly identify a distichon', (done) => {
    const hexameterLine = 'This is a hexameter line of text';
    const pentameterLine = 'This is a pentameter line';
    const text = `${hexameterLine}\n${pentameterLine}`;

    const hexameterPattern = '-UU-UU-UU-UU-UU--';
    const pentameterPattern = '-UU-UU--UU-UU-';

    textParserSpy.parseText.and.callFake((line: string) => {
      if (line === hexameterLine) {
        return {
          pattern: hexameterPattern, 
          syllableCount: 17, 
          moraCount: 24,
          metricFeet: ['Daktylus', 'Daktylus', 'Daktylus', 'Daktylus', 'Daktylus', 'Spondeus'],
          rhythm: 'Daktilikus ritmus',
          verseForm: 'Klasszikus hexameter'
        };
      }
      return {
        pattern: pentameterPattern, 
        syllableCount: 14, 
        moraCount: 20,
        metricFeet: ['Daktylus', 'Daktylus', 'Daktylus', 'Daktylus'],
        rhythm: 'Daktilikus ritmus',
        verseForm: 'Klasszikus pentameter'
      };
    });
    rhymeAnalyzerSpy.analyzeRhyme.and.returnValue({ pattern: ['a', 'a'], rhymeType: 'paired' });

    service.analyze(text).subscribe({
      next: result => {
        expect(result.length).toBe(2);
        expect(result[0].verseType).toBe(VerseType.DistichonHexameter);
        expect(result[1].verseType).toBe(VerseType.DistichonPentameter);
        expect(result[0].isDisztichonPart).toBeTrue();
        expect(result[1].isDisztichonPart).toBeTrue();
        done();
      },
      error: err => {
        fail('Should not error: ' + err);
        done();
      }
    });
  });

  it('should return an empty array for empty input', (done) => {
    // Setup empty case - no lines to analyze, so rhymeAnalyzer won't be called
    rhymeAnalyzerSpy.analyzeRhyme.and.returnValue({ pattern: [], rhymeType: 'none' });
    
    service.analyze('').subscribe({
      next: result => {
        expect(result.length).toBe(0);
        done();
      },
      error: err => {
        fail('Should not error: ' + err);
        done();
      }
    });
  });

  it('should handle rising metrical direction', (done) => {
    const text = 'A rising line';
    const pattern = 'U-U-U-';
    
    textParserSpy.parseText.and.returnValue({
      pattern: pattern, 
      syllableCount: 6, 
      moraCount: 9,
      metricFeet: ['Jambus', 'Jambus', 'Jambus'],
      rhythm: 'Jambikus ritmus',
      verseForm: undefined
    });
    rhymeAnalyzerSpy.analyzeRhyme.and.returnValue({ pattern: ['a'], rhymeType: 'single' });

    service.analyze(text).subscribe({
      next: result => {
        expect(result[0].lejtesirany).toBe(MetricalDirection.Rising);
        done();
      },
      error: err => {
        fail('Should not error: ' + err);
        done();
      }
    });
  });
});
