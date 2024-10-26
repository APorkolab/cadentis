import { TestBed } from '@angular/core/testing';

import { VerseFormService } from './verse-form.service';

describe('VerseFormService', () => {
  let service: VerseFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VerseFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
