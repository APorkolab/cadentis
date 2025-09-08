import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { VerseAnalyzerComponent } from './verse-analyzer.component';
import { VerseAnalysisService } from '../../services/verse-analysis.service';
import { WebWorkerManagerService } from '../../services/web-worker-manager.service';
import { PerformanceMonitorService } from '../../services/performance-monitor.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { VerseLine } from '../../models/verse-line.model';
import { of, delay } from 'rxjs';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatProgressBarHarness } from '@angular/material/progress-bar/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { MetricalDirection } from '../../models/verse.enums';

describe('VerseAnalyzerComponent', () => {
  let component: VerseAnalyzerComponent;
  let fixture: ComponentFixture<VerseAnalyzerComponent>;
  let verseAnalysisServiceSpy: jasmine.SpyObj<VerseAnalysisService>;
  let loader: HarnessLoader;

  const mockVerseLines: VerseLine[] = [
    {
      meterPattern: '-U-',
      syllableCount: 3,
      moraCount: 5,
      verseType: 'test verse',
      text: 'test line 1',
      rhymeScheme: 'a',
      substitutions: [],
      lejtesirany: MetricalDirection.Mixed,
      isDisztichonPart: false
    }
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('VerseAnalysisService', ['analyze', 'getAnalysisStats', 'exportAnalysis', 'analysisProgress$']);
    const webWorkerSpy = jasmine.createSpyObj('WebWorkerManagerService', ['getPerformanceMetrics']);
    const perfSpy = jasmine.createSpyObj('PerformanceMonitorService', ['metrics$']);
    
    // Setup observables
    Object.defineProperty(spy, 'analysisProgress$', {
      value: of({ isAnalyzing: false, progress: 0, currentLine: 0, totalLines: 0 })
    });
    Object.defineProperty(perfSpy, 'metrics$', {
      value: of({ memoryUsage: 1024, activeTasks: 0, completedTasks: 0, averageTaskTime: 0, processingRate: 100 })
    });
    webWorkerSpy.getPerformanceMetrics.and.returnValue(of({ activeTasks: 0, isWorkerAvailable: false, maxConcurrentTasks: 3 }));

    await TestBed.configureTestingModule({
      imports: [VerseAnalyzerComponent, NoopAnimationsModule],
      providers: [
        { provide: VerseAnalysisService, useValue: spy },
        { provide: WebWorkerManagerService, useValue: webWorkerSpy },
        { provide: PerformanceMonitorService, useValue: perfSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerseAnalyzerComponent);
    component = fixture.componentInstance;
    verseAnalysisServiceSpy = TestBed.inject(VerseAnalysisService) as jasmine.SpyObj<VerseAnalysisService>;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call the analysis service after user types with a debounce', fakeAsync(async () => {
    verseAnalysisServiceSpy.analyze.and.returnValue(of(mockVerseLines));
    verseAnalysisServiceSpy.getAnalysisStats.and.returnValue({
      totalLines: 1,
      averageLineLength: 11,
      meterVariety: 1,
      rhymeComplexity: 1,
      mostCommonMeter: '-U-',
      estimatedComplexity: 1.5
    });
    const inputText = 'Arma virumque cano';

    const textareaHarness = await loader.getHarness(MatInputHarness.with({ selector: 'textarea' }));
    await textareaHarness.setValue(inputText);

    // Nothing should happen immediately due to debounce
    expect(verseAnalysisServiceSpy.analyze).not.toHaveBeenCalled();

    // Advance the clock past the debounce time (500ms in component)
    tick(500);
    fixture.detectChanges();

    expect(verseAnalysisServiceSpy.analyze).toHaveBeenCalledWith(inputText);
    expect(verseAnalysisServiceSpy.analyze).toHaveBeenCalledTimes(1);
    expect(component.matchedLines).toEqual(mockVerseLines);
  }));

  it('should properly manage loading state', () => {
    verseAnalysisServiceSpy.analyze.and.returnValue(of(mockVerseLines));
    verseAnalysisServiceSpy.getAnalysisStats.and.returnValue({
      totalLines: 1, averageLineLength: 11, meterVariety: 1,
      rhymeComplexity: 1, mostCommonMeter: '-U-', estimatedComplexity: 1.5
    });
    
    // Initially not loading
    expect(component.isLoading).toBeFalse();
    
    // Trigger input change
    component.onInputChange('some text');
    
    // Should not be loading immediately after input (debounced)
    expect(component.isLoading).toBeFalse();
  });

  it('should display the results table with correct data', fakeAsync(async () => {
    verseAnalysisServiceSpy.analyze.and.returnValue(of(mockVerseLines));
    verseAnalysisServiceSpy.getAnalysisStats.and.returnValue({
      totalLines: 1, averageLineLength: 11, meterVariety: 1,
      rhymeComplexity: 1, mostCommonMeter: '-U-', estimatedComplexity: 1.5
    });

    // Trigger analysis
    component.onInputChange('test');
    tick(500);
    fixture.detectChanges();

    const tableHarness = await loader.getHarness(MatTableHarness);
    const rows = await tableHarness.getRows();
    const firstRowCells = await rows[0].getCellTextByIndex();

    expect(rows.length).toBe(1);
    expect(firstRowCells[0]).toBe(mockVerseLines[0].meterPattern);
    expect(firstRowCells[1]).toBe(mockVerseLines[0].rhymeScheme);
    expect(firstRowCells[4]).toBe(mockVerseLines[0].verseType);
  }));
});
