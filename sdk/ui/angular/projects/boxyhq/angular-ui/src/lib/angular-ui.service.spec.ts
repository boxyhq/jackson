import { TestBed } from '@angular/core/testing';

import { AngularUiService } from './angular-ui.service';

describe('AngularUiService', () => {
  let service: AngularUiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AngularUiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
