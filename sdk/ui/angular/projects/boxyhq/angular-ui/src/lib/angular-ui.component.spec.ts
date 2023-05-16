import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AngularUiComponent } from './angular-ui.component';

describe('AngularUiComponent', () => {
  let component: AngularUiComponent;
  let fixture: ComponentFixture<AngularUiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AngularUiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AngularUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
