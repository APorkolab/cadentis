import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerseAnalyzerComponent } from './verse-analyzer.component';

describe('VerseAnalyzerComponent', () => {
  let component: VerseAnalyzerComponent;
  let fixture: ComponentFixture<VerseAnalyzerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerseAnalyzerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerseAnalyzerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
