import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SyllableCounterComponent } from './syllable-counter.component';
import { TextParserService } from '../../services/text-parser.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatInputHarness } from '@angular/material/input/testing';

describe('SyllableCounterComponent', () => {
  let component: SyllableCounterComponent;
  let fixture: ComponentFixture<SyllableCounterComponent>;
  let textParserServiceSpy: jasmine.SpyObj<TextParserService>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('TextParserService', ['parseText', 'analyzeVerse']);

    await TestBed.configureTestingModule({
      imports: [SyllableCounterComponent, NoopAnimationsModule],
      providers: [
        { provide: TextParserService, useValue: spy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SyllableCounterComponent);
    component = fixture.componentInstance;
    textParserServiceSpy = TestBed.inject(TextParserService) as jasmine.SpyObj<TextParserService>;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate total syllables and moras after user types', fakeAsync(async () => {
    const inputText = 'Hello world\nThis is a test';

    // Setup the spy to return verse analysis
    textParserServiceSpy.analyzeVerse.and.returnValue({
      lines: [
        { pattern: 'U-U', syllableCount: 3, moraCount: 5, metricFeet: ['Jambus'], rhythm: 'Jambikus ritmus', verseForm: undefined },
        { pattern: 'U-UU-', syllableCount: 4, moraCount: 6, metricFeet: ['Jambus', 'Daktylus'], rhythm: 'Vegyes ritmus', verseForm: undefined }
      ],
      totalSyllables: 7,
      totalMoras: 11,
      dominantRhythm: 'Vegyes ritmus',
      possibleMeter: 'Vegyes versmérték'
    });

    const textareaHarness = await loader.getHarness(MatInputHarness.with({ selector: 'textarea' }));
    await textareaHarness.setValue(inputText);

    // Advance the clock past the debounce time (300ms in component)
    tick(300);
    fixture.detectChanges();

    expect(textParserServiceSpy.analyzeVerse).toHaveBeenCalledWith(inputText);

    expect(component.totalSyllables).toBe(7);
    expect(component.totalMoras).toBe(11);
  }));

  it('should display the correct totals in the template', fakeAsync(async () => {
    const inputText = 'test input';
    textParserServiceSpy.analyzeVerse.and.returnValue({
      lines: [
        { pattern: 'U-UU-', syllableCount: 5, moraCount: 8, metricFeet: ['Jambus', 'Daktylus'], rhythm: 'Vegyes ritmus', verseForm: undefined }
      ],
      totalSyllables: 5,
      totalMoras: 8,
      dominantRhythm: 'Vegyes ritmus',
      possibleMeter: 'Vegyes versmérték'
    });

    const textareaHarness = await loader.getHarness(MatInputHarness.with({ selector: 'textarea' }));
    await textareaHarness.setValue(inputText);

    tick(300);
    fixture.detectChanges();

    const resultsDiv = fixture.nativeElement.querySelector('.results');
    expect(resultsDiv).toBeTruthy();

    const statCards = resultsDiv.querySelectorAll('.stat-card strong');
    expect(statCards[0].textContent.trim()).toBe('5');
    expect(statCards[1].textContent.trim()).toBe('8');
  }));
});
