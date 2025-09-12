import { TestBed } from '@angular/core/testing';
import { ProsodyAnalysisService, Syllable, MeterType } from './prosody-analysis.service';

describe('ProsodyAnalysisService', () => {
  let service: ProsodyAnalysisService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProsodyAnalysisService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('syllable detection', () => {
    it('should correctly count syllables in simple words', () => {
      const text = 'hello world';
      const syllables = service.analyzeSyllables(text);
      
      expect(syllables.length).toBeGreaterThan(0);
      expect(syllables[0].word).toBe('hello');
    });

    it('should handle empty strings', () => {
      const text = '';
      const syllables = service.analyzeSyllables(text);
      
      expect(syllables).toEqual([]);
    });

    it('should detect syllable lengths correctly', () => {
      const text = 'arma virumque cano';
      const syllables = service.analyzeSyllables(text);
      
      // Check that syllables have length properties
      syllables.forEach(syllable => {
        expect(syllable.length).toBeDefined();
        expect(['short', 'long', 'anceps']).toContain(syllable.length);
      });
    });

    it('should handle Latin diphthongs', () => {
      const text = 'aurum';
      const syllables = service.analyzeSyllables(text);
      
      expect(syllables.length).toBe(2);
      expect(syllables[0].text).toBe('au');
      expect(syllables[0].length).toBe('long');
    });

    it('should detect consonant clusters', () => {
      const text = 'mons';
      const syllables = service.analyzeSyllables(text);
      
      expect(syllables.length).toBe(1);
      expect(syllables[0].length).toBe('long'); // consonant cluster makes it long
    });
  });

  describe('meter detection', () => {
    it('should detect hexameter pattern', () => {
      const syllables: Syllable[] = [
        { text: 'ar', length: 'long', word: 'arma', position: 1 },
        { text: 'ma', length: 'short', word: 'arma', position: 2 },
        { text: 'vi', length: 'short', word: 'virumque', position: 1 },
        { text: 'rum', length: 'long', word: 'virumque', position: 2 },
        { text: 'que', length: 'short', word: 'virumque', position: 3 }
      ];
      
      const meter = service.detectMeter(syllables);
      expect(meter).toBe('hexameter');
    });

    it('should detect pentameter pattern', () => {
      const syllables: Syllable[] = [
        { text: 'in', length: 'short', word: 'in', position: 1 },
        { text: 'me', length: 'long', word: 'me', position: 1 },
        { text: 'di', length: 'short', word: 'media', position: 1 },
        { text: 'a', length: 'short', word: 'media', position: 2 },
        { text: 're', length: 'long', word: 'res', position: 1 }
      ];
      
      const meter = service.detectMeter(syllables);
      expect(meter).toBe('pentameter');
    });

    it('should handle irregular patterns', () => {
      const syllables: Syllable[] = [
        { text: 'test', length: 'short', word: 'test', position: 1 }
      ];
      
      const meter = service.detectMeter(syllables);
      expect(['irregular', 'unknown']).toContain(meter);
    });
  });

  describe('text analysis', () => {
    it('should analyze complete Latin hexameter verse', () => {
      const text = 'Arma virumque cano, Troiae qui primus ab oris';
      const analysis = service.analyzeText(text);
      
      expect(analysis).toBeDefined();
      expect(analysis.syllables.length).toBeGreaterThan(10);
      expect(analysis.meter).toBe('hexameter');
      expect(analysis.confidence).toBeGreaterThan(0.5);
    });

    it('should provide detailed syllable information', () => {
      const text = 'Arma virumque';
      const analysis = service.analyzeText(text);
      
      analysis.syllables.forEach(syllable => {
        expect(syllable.text).toBeDefined();
        expect(syllable.length).toBeDefined();
        expect(syllable.word).toBeDefined();
        expect(typeof syllable.position).toBe('number');
      });
    });

    it('should calculate analysis confidence', () => {
      const text = 'Arma virumque cano';
      const analysis = service.analyzeText(text);
      
      expect(analysis.confidence).toBeGreaterThanOrEqual(0);
      expect(analysis.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('performance tests', () => {
    it('should analyze long texts within reasonable time', (done) => {
      const longText = 'Arma virumque cano, Troiae qui primus ab oris '.repeat(50);
      const startTime = performance.now();
      
      service.analyzeText(longText).then(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(duration).toBeLessThan(5000); // should complete within 5 seconds
        done();
      });
    });

    it('should handle concurrent analysis requests', async () => {
      const texts = [
        'Arma virumque cano',
        'Eddigi kítárt hadak',
        'In nova fert animus'
      ];
      
      const promises = texts.map(text => service.analyzeText(text));
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.syllables.length).toBeGreaterThan(0);
      });
    });
  });

  describe('error handling', () => {
    it('should handle null input gracefully', () => {
      expect(() => service.analyzeSyllables(null as any)).not.toThrow();
    });

    it('should handle undefined input gracefully', () => {
      expect(() => service.analyzeSyllables(undefined as any)).not.toThrow();
    });

    it('should handle special characters', () => {
      const text = 'test@#$%^&*()test';
      const syllables = service.analyzeSyllables(text);
      
      expect(syllables.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-Latin characters', () => {
      const text = 'тест 测试 テスト';
      expect(() => service.analyzeSyllables(text)).not.toThrow();
    });
  });

  describe('integration with ML service', () => {
    it('should use ML predictions when available', async () => {
      const text = 'Arma virumque cano';
      const analysis = await service.analyzeText(text);
      
      // Should have ML confidence scores
      expect(analysis.mlConfidence).toBeDefined();
      expect(analysis.mlConfidence).toBeGreaterThanOrEqual(0);
    });

    it('should fall back to rule-based analysis when ML fails', async () => {
      // Mock ML service failure
      spyOn(service as any, 'getMLPrediction').and.returnValue(Promise.reject('ML service unavailable'));
      
      const text = 'Arma virumque';
      const analysis = await service.analyzeText(text);
      
      expect(analysis.syllables.length).toBeGreaterThan(0);
      expect(analysis.meter).toBeDefined();
    });
  });

  describe('caching behavior', () => {
    it('should cache analysis results', async () => {
      const text = 'Arma virumque cano';
      
      const firstCall = await service.analyzeText(text);
      const secondCall = await service.analyzeText(text);
      
      // Results should be identical (cached)
      expect(firstCall).toEqual(secondCall);
    });

    it('should invalidate cache when analysis method changes', () => {
      const text = 'test text';
      
      // First analysis with default settings
      service.analyzeText(text);
      
      // Change analysis settings
      service.updateConfiguration({ useMLPredictions: false });
      
      // Should perform new analysis, not use cache
      const spy = spyOn(service as any, 'performAnalysis');
      service.analyzeText(text);
      
      expect(spy).toHaveBeenCalled();
    });
  });
});
