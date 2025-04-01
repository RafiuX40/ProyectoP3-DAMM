import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersPublicsPage } from './users-publics.page';

describe('UsersPublicsPage', () => {
  let component: UsersPublicsPage;
  let fixture: ComponentFixture<UsersPublicsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersPublicsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
