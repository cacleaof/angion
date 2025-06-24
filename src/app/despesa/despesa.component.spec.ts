import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DespesaComponent } from './despesa.component';

describe('DespesaComponent', () => {
  let component: DespesaComponent;
  let fixture: ComponentFixture<DespesaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DespesaComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(DespesaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
