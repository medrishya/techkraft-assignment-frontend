import 'zone.js';
import 'zone.js/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationFiltersComponent } from './application-filters.component';

describe('ApplicationFiltersComponent', () => {
  let fixture: ComponentFixture<ApplicationFiltersComponent>;
  let component: ApplicationFiltersComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationFiltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#applicationSearch');
  }

  function getApplicationStatusSelect(): HTMLSelectElement {
    return fixture.nativeElement.querySelector('#applicationStatus');
  }

  function getRiskStatusSelect(): HTMLSelectElement {
    return fixture.nativeElement.querySelector('#riskStatus');
  }

  function getButton(text: string): HTMLButtonElement {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    const button = buttons.find((item) => item.textContent?.trim() === text);

    if (!button) {
      throw new Error(`Button "${text}" not found`);
    }

    return button;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the search input and filter labels', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(
      element.querySelector('label[for="applicationSearch"]')?.textContent,
    ).toContain('Search applications');

    expect(
      element.querySelector('label[for="applicationStatus"]')?.textContent,
    ).toContain('Application status');

    expect(
      element.querySelector('label[for="riskStatus"]')?.textContent,
    ).toContain('Risk status');

    expect(getInput().placeholder).toBe('Business, owner, or email...');
  });

  it('should display default filter values', () => {
    expect(getInput().value).toBe('');
    expect(getApplicationStatusSelect().value).toBe('');
    expect(getRiskStatusSelect().value).toBe('');
  });

  it('should display values provided through inputs', async () => {
    fixture.componentRef.setInput('search', 'Acme');
    fixture.componentRef.setInput('applicationStatus', 'APPROVED');
    fixture.componentRef.setInput('riskStatus', 'PENDING');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.search()).toBe('Acme');
    expect(component.applicationStatus()).toBe('APPROVED');
    expect(component.riskStatus()).toBe('PENDING');

    expect(getInput().value).toBe('Acme');
    expect(getApplicationStatusSelect().value).toBe('APPROVED');
    expect(getRiskStatusSelect().value).toBe('PENDING');
  });

  it('should emit searchChange when the search input changes', () => {
    const emitSpy = vi.spyOn(component.searchChange, 'emit');
    const input = getInput();

    input.value = 'Acme Corporation';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalledWith('Acme Corporation');
  });

  it('should emit apply when Enter is pressed in the search input', () => {
    const applySpy = vi.spyOn(component.apply, 'emit');

    getInput().dispatchEvent(
      new KeyboardEvent('keyup', {
        key: 'Enter',
        bubbles: true,
      }),
    );

    expect(applySpy).toHaveBeenCalledTimes(1);
  });

  it('should emit applicationStatusChange when the application status changes', () => {
    const emitSpy = vi.spyOn(component.applicationStatusChange, 'emit');
    const select = getApplicationStatusSelect();

    select.value = 'APPROVED';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalledWith('APPROVED');
  });

  it('should apply filters when the application status changes', () => {
    const applySpy = vi.spyOn(component.apply, 'emit');
    const select = getApplicationStatusSelect();

    select.value = 'REJECTED';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(applySpy).toHaveBeenCalledTimes(1);
  });

  it('should emit riskStatusChange when the risk status changes', () => {
    const emitSpy = vi.spyOn(component.riskStatusChange, 'emit');
    const select = getRiskStatusSelect();

    select.value = 'NEEDS_INFO';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalledWith('NEEDS_INFO');
  });

  it('should apply filters when the risk status changes', () => {
    const applySpy = vi.spyOn(component.apply, 'emit');
    const select = getRiskStatusSelect();

    select.value = 'REJECTED';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(applySpy).toHaveBeenCalledTimes(1);
  });

  it('should emit apply when the Search button is clicked', () => {
    const applySpy = vi.spyOn(component.apply, 'emit');

    getButton('Search').click();

    expect(applySpy).toHaveBeenCalledTimes(1);
  });

  it('should emit clear when the Clear button is clicked', () => {
    const clearSpy = vi.spyOn(component.clear, 'emit');

    const clearButton = fixture.nativeElement.querySelector(
      'button[aria-label="Clear filters"]',
    ) as HTMLButtonElement;

    clearButton.click();

    expect(clearSpy).toHaveBeenCalledTimes(1);
  });

  it('should not emit apply when submitFilters is called while disabled', () => {
    const applySpy = vi.spyOn(component.apply, 'emit');

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    component.submitFilters();

    expect(applySpy).not.toHaveBeenCalled();
  });

  it('should not emit clear when clearFilters is called while disabled', () => {
    const clearSpy = vi.spyOn(component.clear, 'emit');

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    component.clearFilters();

    expect(clearSpy).not.toHaveBeenCalled();
  });

  it('should disable Search and Clear buttons when disabled is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    expect(getButton('Search').disabled).toBe(true);

    const clearButton = fixture.nativeElement.querySelector(
      'button[aria-label="Clear filters"]',
    ) as HTMLButtonElement;

    expect(clearButton.disabled).toBe(true);
  });

  it('should enable Search and Clear buttons when disabled is false', () => {
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();

    expect(getButton('Search').disabled).toBe(false);

    const clearButton = fixture.nativeElement.querySelector(
      'button[aria-label="Clear filters"]',
    ) as HTMLButtonElement;

    expect(clearButton.disabled).toBe(false);
  });

  it('should not apply filters on Enter when disabled', () => {
    const applySpy = vi.spyOn(component.apply, 'emit');

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    getInput().dispatchEvent(
      new KeyboardEvent('keyup', {
        key: 'Enter',
        bubbles: true,
      }),
    );

    expect(applySpy).not.toHaveBeenCalled();
  });

  it('should not apply filters when disabled and a status changes', () => {
    const applySpy = vi.spyOn(component.apply, 'emit');

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    component.submitFilters();

    expect(applySpy).not.toHaveBeenCalled();
  });

  it('should render all application status options', () => {
    const options = Array.from(getApplicationStatusSelect().options).map(
      (option) => ({
        value: option.value,
        text: option.textContent?.trim(),
      }),
    );

    expect(options).toEqual([
      { value: '', text: 'All statuses' },
      { value: 'DRAFT', text: 'Draft' },
      { value: 'SUBMITTED', text: 'Submitted' },
      { value: 'UNDER_REVIEW', text: 'Under review' },
      { value: 'APPROVED', text: 'Approved' },
      { value: 'REJECTED', text: 'Rejected' },
    ]);
  });

  it('should render all risk status options', () => {
    const options = Array.from(getRiskStatusSelect().options).map((option) => ({
      value: option.value,
      text: option.textContent?.trim(),
    }));

    expect(options).toEqual([
      { value: '', text: 'All risks' },
      { value: 'PENDING', text: 'Pending' },
      { value: 'APPROVED', text: 'Approved' },
      { value: 'NEEDS_INFO', text: 'Needs Info' },
      { value: 'REJECTED', text: 'Rejected' },
    ]);
  });
});
