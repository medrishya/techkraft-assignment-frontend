import 'zone.js';
import 'zone.js/testing';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationsPaginationComponent } from './applications-pagination.component';

describe('ApplicationsPaginationComponent', () => {
  let fixture: ComponentFixture<ApplicationsPaginationComponent>;
  let component: ApplicationsPaginationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsPaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsPaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getPageSizeSelect(): HTMLSelectElement {
    return fixture.nativeElement.querySelector(
      '#pageSize',
    ) as HTMLSelectElement;
  }

  function getSelectedPageSize(): string {
    return getPageSizeSelect().selectedOptions[0]?.textContent?.trim() ?? '';
  }

  function getButton(label: string): HTMLButtonElement {
    const button = fixture.nativeElement.querySelector(
      `button[aria-label="${label}"]`,
    ) as HTMLButtonElement | null;

    if (!button) {
      throw new Error(`Button "${label}" not found`);
    }

    return button;
  }

  function selectPageSize(size: number): void {
    const select = getPageSizeSelect();

    const option = Array.from(select.options).find(
      (item) => item.textContent?.trim() === String(size),
    );

    if (!option) {
      throw new Error(`Page-size option "${size}" not found`);
    }

    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display default pagination values', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(getSelectedPageSize()).toBe('10');

    expect(element.querySelector('.record-count')?.textContent?.trim()).toBe(
      '0–0 of 0',
    );

    expect(element.querySelector('.page-indicator')?.textContent).toContain(
      'Page 1 of 1',
    );
  });

  it('should display the provided pagination inputs', async () => {
    fixture.componentRef.setInput('page', 2);
    fixture.componentRef.setInput('limit', 25);
    fixture.componentRef.setInput('totalPages', 4);
    fixture.componentRef.setInput('total', 80);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;

    expect(component.page()).toBe(2);
    expect(component.limit()).toBe(25);
    expect(component.totalPages()).toBe(4);
    expect(component.total()).toBe(80);

    expect(element.querySelector('.record-count')?.textContent?.trim()).toBe(
      '26–50 of 80',
    );

    expect(element.querySelector('.page-indicator')?.textContent).toContain(
      'Page 2 of 4',
    );

    // Verify the selected option by its actual selection state.
    const selectedOption = Array.from(getPageSizeSelect().options).find(
      (option) => option.selected,
    );

    expect(selectedOption?.textContent?.trim()).toBe('25');
  });

  it('should calculate the record start correctly', () => {
    fixture.componentRef.setInput('page', 3);
    fixture.componentRef.setInput('limit', 10);
    fixture.componentRef.setInput('total', 45);

    expect(component.recordStart()).toBe(21);
  });

  it('should return zero as record start when there are no records', () => {
    fixture.componentRef.setInput('page', 1);
    fixture.componentRef.setInput('limit', 10);
    fixture.componentRef.setInput('total', 0);

    expect(component.recordStart()).toBe(0);
  });

  it('should calculate the record end correctly', () => {
    fixture.componentRef.setInput('page', 2);
    fixture.componentRef.setInput('limit', 10);
    fixture.componentRef.setInput('total', 35);

    expect(component.recordEnd()).toBe(20);
  });

  it('should not return a record end greater than the total', () => {
    fixture.componentRef.setInput('page', 3);
    fixture.componentRef.setInput('limit', 10);
    fixture.componentRef.setInput('total', 25);

    expect(component.recordEnd()).toBe(25);
  });

  it('should display all available page-size options', () => {
    const options = Array.from(getPageSizeSelect().options).map((option) =>
      option.textContent?.trim(),
    );

    expect(options).toEqual(['10', '25', '50', '100']);
  });

  it('should emit pageSizeChange with a number when page size changes', () => {
    const emitSpy = vi.spyOn(component.pageSizeChange, 'emit');

    selectPageSize(25);

    expect(emitSpy).toHaveBeenCalledWith(25);
    expect(typeof emitSpy.mock.calls[0][0]).toBe('number');
  });

  it('should emit the previous page when Previous is clicked', () => {
    const emitSpy = vi.spyOn(component.pageChange, 'emit');

    fixture.componentRef.setInput('page', 2);
    fixture.componentRef.setInput('totalPages', 4);
    fixture.detectChanges();

    getButton('Go to previous page').click();

    expect(emitSpy).toHaveBeenCalledWith(1);
  });

  it('should emit the next page when Next is clicked', () => {
    const emitSpy = vi.spyOn(component.pageChange, 'emit');

    fixture.componentRef.setInput('page', 2);
    fixture.componentRef.setInput('totalPages', 4);
    fixture.detectChanges();

    getButton('Go to next page').click();

    expect(emitSpy).toHaveBeenCalledWith(3);
  });

  it('should disable Previous on the first page', () => {
    fixture.componentRef.setInput('page', 1);
    fixture.componentRef.setInput('totalPages', 4);
    fixture.detectChanges();

    expect(getButton('Go to previous page').disabled).toBe(true);
    expect(getButton('Go to next page').disabled).toBe(false);
  });

  it('should disable Next on the last page', () => {
    fixture.componentRef.setInput('page', 4);
    fixture.componentRef.setInput('totalPages', 4);
    fixture.detectChanges();

    expect(getButton('Go to previous page').disabled).toBe(false);
    expect(getButton('Go to next page').disabled).toBe(true);
  });

  it('should disable both navigation buttons when disabled is true', () => {
    fixture.componentRef.setInput('page', 2);
    fixture.componentRef.setInput('totalPages', 4);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    expect(getButton('Go to previous page').disabled).toBe(true);
    expect(getButton('Go to next page').disabled).toBe(true);
  });

  it('should disable the page-size select when disabled is true', async () => {
    fixture.componentRef.setInput('disabled', true);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.disabled()).toBe(true);

    const select = getPageSizeSelect();
    expect(select.hasAttribute('disabled')).toBe(true);
    expect(select.disabled).toBe(true);
  });

  it('should enable the controls when disabled is false and navigation allows it', () => {
    fixture.componentRef.setInput('page', 2);
    fixture.componentRef.setInput('limit', 25);
    fixture.componentRef.setInput('totalPages', 4);
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();

    expect(getPageSizeSelect().disabled).toBe(false);
    expect(getButton('Go to previous page').disabled).toBe(false);
    expect(getButton('Go to next page').disabled).toBe(false);
  });

  it('should render the pagination navigation label', () => {
    const nav = fixture.nativeElement.querySelector('nav');

    expect(nav.getAttribute('aria-label')).toBe('Application pagination');
  });
});
