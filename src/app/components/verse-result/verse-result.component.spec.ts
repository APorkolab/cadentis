import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerseResultComponent } from './verse-result.component';

describe('VerseResultComponent', () => {
  let component: VerseResultComponent;
  let fixture: ComponentFixture<VerseResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerseResultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerseResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
