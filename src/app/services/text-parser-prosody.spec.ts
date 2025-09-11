import { TestBed } from '@angular/core/testing';
import { TextParserService } from './text-parser.service';

describe('TextParserService - Hungarian Prosodic Patterns', () => {
  let service: TextParserService;

  const testCases = [
    {
      description: 'Hexameter line 1',
      text: 'Eddig Itália földjén termettek csak a könyvek',
      expectedPattern: '-UU-UU-----UU--',  // Correct: ed(L) dig(S) i(S) tá(L) li(S) a(S) föl(L) djén(L) ter(L) met(L) tek(L) csak(S) a(S) kön(L) yvek(L)
      expectedSyllables: 15,
      expectedForm: 'Hexameter'
    },
    {
      description: 'Pentameter line 2', 
      text: 'S most Pannónia is ontja a szép dalokat',
      expectedPattern: '--UUU-UU-UU-',  // Correct: most(L) pan(L) nó(L) ni(S) a(S) is(S) on(L) tja(S) a(S) szép(L) da(S) lo(S) kat(L)
      expectedSyllables: 13,
      expectedForm: 'Pentameter'
    },
    {
      description: 'Hexameter line 3',
      text: 'Sokra becsülnek már, a hazám is büszke lehet rám',
      expectedPattern: '-UU--UUU--UUU--',  // Correct: sok(L) ra(S) bec(S) sül(L) nek(L) már(L) a(S) ha(S) zám(S) is(L) büs(L) zke(S) le(S) het(S) rám(L)
      expectedSyllables: 15,
      expectedForm: 'Hexameter'  
    },
    {
      description: 'Pentameter line 4',
      text: 'Szellemem egyre dicsőbb, s általa híres e föld',
      expectedPattern: '-UU-UU--UU-UU-',  // Correct: szel(L) le(S) mem(S) eg(L) yre(S) dic(S) sőbb(L) ál(L) ta(S) la(S) hí(L) res(S) e(S) föld(L)
      expectedSyllables: 14,
      expectedForm: 'Pentameter'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TextParserService);
  });

  testCases.forEach((testCase, index) => {
    describe(`${testCase.description}: "${testCase.text}"`, () => {
      it(`should produce pattern "${testCase.expectedPattern}" with ${testCase.expectedSyllables} syllables`, () => {
        const result = service.parseText(testCase.text);
        
        console.log(`\nTest ${index + 1}: ${testCase.description}`);
        console.log(`Text: "${testCase.text}"`);
        console.log(`Expected: ${testCase.expectedPattern} (${testCase.expectedSyllables} syllables)`);
        console.log(`Actual:   ${result.pattern} (${result.syllableCount} syllables)`);
        console.log(`Form:     ${result.verseForm || 'Unknown'}`);
        
        // Add detailed syllable debug
        const debugResult = (service as any).debugParseText(testCase.text);
        console.log('Syllables:', debugResult.syllables);
        console.log('Debug info:', debugResult.debug);
        
        expect(result.syllableCount).toBe(testCase.expectedSyllables);
        expect(result.pattern).toBe(testCase.expectedPattern);
      });
      
      it(`should identify as ${testCase.expectedForm}`, () => {
        const result = service.parseText(testCase.text);
        expect(result.verseForm).toBe(testCase.expectedForm);
      });
    });
  });
});
