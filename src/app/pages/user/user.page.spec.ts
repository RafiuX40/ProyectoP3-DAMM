import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsuarioPropioPage } from './user.page';

describe('UserPage', () => {
  let component: UsuarioPropioPage;
  let fixture: ComponentFixture<UsuarioPropioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UsuarioPropioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
