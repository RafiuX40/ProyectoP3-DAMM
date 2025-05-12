import { TestBed } from '@angular/core/testing';

import { UserService } from './user-info.service';

describe('UserInfoService', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
