import { TestBed } from '@angular/core/testing';
import { VerseAnalysisService } from './verse-analysis.service';
import { TextParserService } from './text-parser.service';
import { RhymeAnalyzerService } from './rhyme-analyzer.service';
import { VerseFormService } from './verse-form.service';
import { of } from 'rxjs';
import { MetricalDirection, VerseType } from '../models/verse.enums';
import { VerseForm } from '../models/verse-form.model';

describe('VerseAnalysisService', () => {
  let service: VerseAnalysisService;
  let textParserSpy: jasmine.SpyObj<TextParserService>;
  let rhymeAnalyzerSpy: jasmine.SpyObj<RhymeAnalyzerService>;
  let verseFormSpy: jasmine.SpyObj<VerseFormService>;

  const mockVerseForms: VerseForm[] = [
    { formName: VerseType.Hexameter, pattern: '(-UU|-UU|-UU|-UU|-UU|--)', moraCount: 24, type: 'periódus' },
    { formName: VerseType.Pentameter, pattern: '(-UU|-UU-| -UU|-UU|-)', moraCount: 20, type: 'periódus' }
  ];

  beforeEach(() => {
    const textSpy = jasmine.createSpyObj('TextParserService', ['parseText']);
    const rhymeSpy = jasmine.createSpyObj('RhymeAnalyzerService', ['analyzeRhyme']);
    const formSpy = jasmine.createSpyObj('VerseFormService', ['getVerseForms']);

    TestBed.configureTestingModule({
      providers: [
        VerseAnalysisService,
        { provide: TextParserService, useValue: textSpy },
        { provide: RhymeAnalyzerService, useValue: rhymeSpy },
        { provide: VerseFormService, useValue: formSpy },
      ],
    });

    service = TestBed.inject(VerseAnalysisService);
    textParserSpy = TestBed.inject(TextParserService) as jasmine.SpyObj<TextParserService>;
    rhymeAnalyzerSpy = TestBed.inject(RhymeAnalyzerService) as jasmine.SpyObj<RhymeAnalyzerService>;
    verseFormSpy = TestBed.inject(VerseFormService) as jasmine.SpyObj<VerseFormService>;

    verseFormSpy.getVerseForms.and.returnValue(of(mockVerseForms));
    // Manually trigger the subscription in the service constructor
    service['verseFormService'].getVerseForms().subscribe(forms => {
      service['verseForms'] = forms;
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should analyze a single line and identify it as hexameter', () => {
    const text = 'Arma virumque cano, Troiae qui primus ab oris';
    const pattern = '-UU-UU-UU-UU-UU--';
    textParserSpy.parseText.and.returnValue({ pattern: pattern, syllableCount: 17, moraCount: 24 });
    rhymeAnalyzerSpy.analyzeRhyme.and.returnValue({ pattern: ['a'], rhymeType: 'single' });

    const result = service.analyze(text);

    expect(result.length).toBe(1);
    expect(result[0].text).toBe(text);
    expect(result[0].verseType).toBe(`+${VerseType.Hexameter}`);
    expect(result[0].meterPattern).toBe(pattern);
    expect(result[0].lejtesirany).toBe(MetricalDirection.Falling);
  });

  it('should correctly identify a distichon', () => {
    const hexameterLine = 'This is a hexameter line of text';
    const pentameterLine = 'This is a pentameter line';
    const text = `${hexameterLine}\n${pentameterLine}`;

    const hexameterPattern = '-UU-UU-UU-UU-UU--'; // Classic hexameter
    const pentameterPattern = '-UU-UU--UU-UU-'; // Classic pentameter

    textParserSpy.parseText.and.callFake((line: string) => {
      if (line === hexameterLine) {
        return { pattern: hexameterPattern, syllableCount: 17, moraCount: 24 };
      }
      return { pattern: pentameterPattern, syllableCount: 14, moraCount: 20 };
    });
    rhymeAnalyzerSpy.analyzeRhyme.and.returnValue({ pattern: ['a', 'a'], rhymeType: 'paired' });

    const result = service.analyze(text);

    expect(result.length).toBe(2);
    expect(result[0].verseType).toBe(VerseType.DistichonHexameter);
    expect(result[1].verseType).toBe(VerseType.DistichonPentameter);
    expect(result[0].isDisztichonPart).toBeTrue();
    expect(result[1].isDisztichonPart).toBeTrue();
  });

  it('should return an empty array for empty input', () => {
    const result = service.analyze('');
    expect(result.length).toBe(0);
  });

  it('should handle rising metrical direction', () => {
    const text = 'A rising line';
    const pattern = 'U-U-U-';
    textParserSpy.parseText.and.returnValue({ pattern: pattern, syllableCount: 6, moraCount: 9 });
    rhymeAnalyzerSpy.analyzeRhyme.and.returnValue({ pattern: ['a'], rhymeType: 'single' });

    const result = service.analyze(text);
    expect(result[0].lejtesirany).toBe(MetricalDirection.Rising);
  });
});
