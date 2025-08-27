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
    const spy = jasmine.createSpyObj('TextParserService', ['parseText']);

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
    const lines = inputText.split('\n');

    // Setup the spy to return different values for each line
    textParserServiceSpy.parseText.and.callFake((line: string) => {
      if (line === lines[0]) {
        return { pattern: '', syllableCount: 3, moraCount: 5 };
      }
      if (line === lines[1]) {
        return { pattern: '', syllableCount: 4, moraCount: 6 };
      }
      return { pattern: '', syllableCount: 0, moraCount: 0 };
    });

    const textareaHarness = await loader.getHarness(MatInputHarness.with({ selector: 'textarea' }));
    await textareaHarness.setValue(inputText);

    // Advance the clock past the debounce time (300ms in component)
    tick(300);
    fixture.detectChanges();

    expect(textParserServiceSpy.parseText).toHaveBeenCalledTimes(2);
    expect(textParserServiceSpy.parseText).toHaveBeenCalledWith(lines[0]);
    expect(textParserServiceSpy.parseText).toHaveBeenCalledWith(lines[1]);

    // 3 + 4 = 7
    expect(component.totalSyllables).toBe(7);
    // 5 + 6 = 11
    expect(component.totalMoras).toBe(11);
  }));

  it('should display the correct totals in the template', fakeAsync(async () => {
    const inputText = 'test input';
    textParserServiceSpy.parseText.and.returnValue({ pattern: '', syllableCount: 5, moraCount: 8 });

    const textareaHarness = await loader.getHarness(MatInputHarness.with({ selector: 'textarea' }));
    await textareaHarness.setValue(inputText);

    tick(300);
    fixture.detectChanges();

    const resultsDiv = fixture.nativeElement.querySelector('.results');
    expect(resultsDiv).toBeTruthy();

    const paragraphs = resultsDiv.querySelectorAll('p');
    expect(paragraphs[0].textContent).toContain('Total Syllables: 5');
    expect(paragraphs[1].textContent).toContain('Total Moras: 8');
  }));
});
