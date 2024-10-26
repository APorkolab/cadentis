import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SyllableCounterComponent } from './syllable-counter.component';

describe('SyllableCounterComponent', () => {
  let component: SyllableCounterComponent;
  let fixture: ComponentFixture<SyllableCounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SyllableCounterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SyllableCounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
