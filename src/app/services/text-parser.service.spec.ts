import { TestBed } from '@angular/core/testing';

import { TextParserService } from './text-parser.service';

describe('TextParserService', () => {
  let service: TextParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TextParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
