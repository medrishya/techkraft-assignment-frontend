import 'zone.js';
import 'zone.js/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorActionsComponent } from './editor-actions.component';

describe('EditorActionsComponent', () => {
  let fixture: ComponentFixture<EditorActionsComponent>;
  let component: EditorActionsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorActionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorActionsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('currentStep', 0);
    fixture.componentRef.setInput('totalSteps', 3);
    fixture.componentRef.setInput('saving', false);
    fixture.componentRef.setInput('mode', 'add');

    fixture.detectChanges();
  });

  function buttons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button'));
  }

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display Back and Next on the first step', () => {
    expect(buttons()[0].textContent?.trim()).toBe('Back');
    expect(buttons()[1].textContent?.trim()).toBe('Next');
  });

  it('should disable Back on the first step', () => {
    expect(buttons()[0].disabled).toBe(true);
  });

  it('should enable Next when not saving', () => {
    expect(buttons()[1].disabled).toBe(false);
  });

  it('should emit previous when Back is clicked', () => {
    fixture.componentRef.setInput('currentStep', 1);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.previous, 'emit');

    buttons()[0].click();

    expect(emitSpy).toHaveBeenCalledOnce();
  });

  it('should emit next when Next is clicked', () => {
    const emitSpy = vi.spyOn(component.next, 'emit');

    buttons()[1].click();

    expect(emitSpy).toHaveBeenCalledOnce();
  });

  it('should show Create Application on the last step in add mode', () => {
    fixture.componentRef.setInput('currentStep', 2);
    fixture.detectChanges();

    expect(buttons()[1].textContent?.trim()).toBe('Create Application');
    expect(buttons()[1].type).toBe('submit');
  });

  it('should show Update Application on the last step in edit mode', () => {
    fixture.componentRef.setInput('currentStep', 2);
    fixture.componentRef.setInput('mode', 'edit');
    fixture.detectChanges();

    expect(buttons()[1].textContent?.trim()).toBe('Update Application');
  });

  it('should disable Back and Next while saving', () => {
    fixture.componentRef.setInput('currentStep', 1);
    fixture.componentRef.setInput('saving', true);
    fixture.detectChanges();

    expect(buttons()[0].disabled).toBe(true);
    expect(buttons()[1].disabled).toBe(true);
  });

  it('should show Saving and disable submit while saving', () => {
    fixture.componentRef.setInput('currentStep', 2);
    fixture.componentRef.setInput('saving', true);
    fixture.detectChanges();

    expect(buttons()[1].textContent?.trim()).toBe('Saving...');
    expect(buttons()[1].disabled).toBe(true);
  });

  it('should not render Next on the last step', () => {
    fixture.componentRef.setInput('currentStep', 2);
    fixture.detectChanges();

    expect(
      buttons().some((button) => button.textContent?.trim() === 'Next'),
    ).toBe(false);
  });
});
