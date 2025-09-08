import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { VerseAnalyzerComponent } from './verse-analyzer.component';
import { VerseAnalysisService } from '../../services/verse-analysis.service';
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
    const spy = jasmine.createSpyObj('VerseAnalysisService', ['analyze']);

    await TestBed.configureTestingModule({
      imports: [VerseAnalyzerComponent, NoopAnimationsModule],
      providers: [
        { provide: VerseAnalysisService, useValue: spy }
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
    
    // Initially not loading
    expect(component.isLoading).toBeFalse();
    
    // Trigger input change
    component.onInputChange('some text');
    
    // Should not be loading immediately after input (debounced)
    expect(component.isLoading).toBeFalse();
  });

  it('should display the results table with correct data', fakeAsync(async () => {
    verseAnalysisServiceSpy.analyze.and.returnValue(of(mockVerseLines));

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
