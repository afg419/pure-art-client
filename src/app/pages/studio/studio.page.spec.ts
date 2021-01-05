import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { StudioPage } from './studio.page';

describe('StudioPage', () => {
  let component: StudioPage;
  let fixture: ComponentFixture<StudioPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StudioPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(StudioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
