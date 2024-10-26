import { TestBed } from '@angular/core/testing';

import { RhymeAnalyzerService } from './rhyme-analyzer.service';

describe('RhymeAnalyzerService', () => {
  let service: RhymeAnalyzerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RhymeAnalyzerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
