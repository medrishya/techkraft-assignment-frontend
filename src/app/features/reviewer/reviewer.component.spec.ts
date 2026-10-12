import 'zone.js';
import 'zone.js/testing';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { ReviewerComponent } from './reviewer.component';

import type {
  Application,
  CurrentUser,
  Review,
  ReviewDecision,
  ReviewSubmissionResponse,
  ReviewerOption,
} from './models/reviewer.model';

describe('ReviewerComponent', () => {
  let fixture: ComponentFixture<ReviewerComponent>;
  let component: ReviewerComponent;
  let httpTestingController: HttpTestingController;

  const applicationId = 'application-123';

  const adminUser = {
    id: 'admin-1',
    email: 'admin@example.com',
    role: 'ADMIN',
  } as CurrentUser;

  const reviewerUser = {
    id: 'reviewer-1',
    email: 'reviewer@example.com',
    role: 'REVIEWER',
  } as CurrentUser;

  const salesUser = {
    id: 'sales-1',
    email: 'sales@example.com',
    role: 'SALES',
  } as CurrentUser;

  const mockApplication = {
    id: applicationId,
    business_name: 'Example Business',
    application_status: 'UNDER_REVIEW',
    risk_status: 'PENDING',
    assigned_reviewer_id: 'reviewer-1',
    reviewer_id: 'reviewer-1',
    assigned_reviewer_name: 'Jane Reviewer',
  } as Application;

  const mockReviewers = [
    {
      id: 'reviewer-1',
      name: 'Jane Reviewer',
      email: 'jane@example.com',
      role: 'REVIEWER',
    },
    {
      id: 'reviewer-2',
      name: 'John Reviewer',
      email: 'john@example.com',
      role: 'REVIEWER',
    },
    {
      id: 'sales-1',
      name: 'Sales User',
      email: 'sales@example.com',
      role: 'SALES',
    },
  ] as ReviewerOption[];

  const mockReview = {
    id: 'review-1',
    application_id: applicationId,
    decision: 'APPROVE',
    comments: 'Looks good',
    actor_id: 'reviewer-1',
    actor_name: 'Jane Reviewer',
    application_status: 'APPROVED',
    risk_status: 'APPROVED',
    created_at: '2026-10-12T08:00:00.000Z',
  } as Review;

  const apiUrl = 'http://localhost:3000/api/applications';
  const authUrl = 'http://localhost:3000';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewerComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'application-123' : null),
              },
            },
          },
        },
      ],
    })
      .overrideComponent(ReviewerComponent, {
        set: { template: '' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ReviewerComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  function initialize(): void {
    fixture.detectChanges();
  }

  function expectCurrentUserRequest(user: CurrentUser): void {
    const request = httpTestingController.expectOne(`${authUrl}/me`);

    expect(request.request.method).toBe('GET');
    request.flush(user);
  }

  function expectApplicationRequest(
    application: Application = mockApplication,
  ): void {
    const request = httpTestingController.expectOne(
      `${apiUrl}/${encodeURIComponent(applicationId)}`,
    );

    expect(request.request.method).toBe('GET');
    request.flush(application);
  }

  function expectReviewersRequest(
    reviewers: ReviewerOption[] = mockReviewers,
  ): void {
    const request = httpTestingController.expectOne(
      `${authUrl}/api/users?role=REVIEWER`,
    );

    expect(request.request.method).toBe('GET');
    request.flush({ data: reviewers });
  }

  function expectReviewsRequest(reviews: Review[] = [mockReview]): void {
    const request = httpTestingController.expectOne(
      `${apiUrl}/${encodeURIComponent(applicationId)}/reviews`,
    );

    expect(request.request.method).toBe('GET');
    request.flush({ data: reviews });
  }

  function initializeAdmin(): void {
    initialize();

    expectCurrentUserRequest(adminUser);
    expectApplicationRequest();
    expectReviewersRequest();
    expectReviewsRequest();
  }

  function initializeReviewer(): void {
    initialize();

    expectCurrentUserRequest(reviewerUser);
    expectApplicationRequest();
    expectReviewsRequest();
  }

  describe('initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with the expected default state', () => {
      expect(component.application()).toBeNull();
      expect(component.currentUser()).toBeNull();
      expect(component.reviews()).toEqual([]);
      expect(component.reviewers()).toEqual([]);

      expect(component.loading()).toBe(true);
      expect(component.loadingReviews()).toBe(false);
      expect(component.loadingReviewers()).toBe(false);
      expect(component.savingAssignment()).toBe(false);
      expect(component.submitting()).toBe(false);

      expect(component.error()).toBe('');
      expect(component.success()).toBe('');
      expect(component.showConfirmModal()).toBe(false);
      expect(component.confirmAction()).toBeNull();

      expect(component.reviewForm.controls.decision.value).toBe('APPROVE');
      expect(component.reviewForm.controls.comments.value).toBe('');
      expect(component.assignmentForm.controls.reviewerId.value).toBe('');
    });

    it('should require an application ID', () => {
      TestBed.resetTestingModule();

      TestBed.configureTestingModule({
        imports: [ReviewerComponent],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: {
                  get: () => null,
                },
              },
            },
          },
        ],
      }).overrideComponent(ReviewerComponent, {
        set: { template: '' },
      });

      const missingIdFixture = TestBed.createComponent(ReviewerComponent);
      const missingIdComponent = missingIdFixture.componentInstance;

      missingIdFixture.detectChanges();

      expect(missingIdComponent.loading()).toBe(false);
      expect(missingIdComponent.error()).toBe('An application ID is required.');

      missingIdFixture.destroy();
    });
  });

  describe('current user and permissions', () => {
    it('should allow an admin to review applications', () => {
      component.currentUser.set(adminUser);

      expect(component.canReview()).toBe(true);
    });

    it('should allow a reviewer to review applications', () => {
      component.currentUser.set(reviewerUser);

      expect(component.canReview()).toBe(true);
    });

    it('should not allow a sales user to review applications', () => {
      component.currentUser.set(salesUser);

      expect(component.canReview()).toBe(false);
    });

    it('should load application and reviewers for an admin', () => {
      initialize();

      expectCurrentUserRequest(adminUser);

      // Responding to /me triggers these requests.
      expectApplicationRequest();
      expectReviewersRequest();

      // Loading the application triggers the review-history request.
      expectReviewsRequest();

      expect(component.currentUser()).toEqual(adminUser);
      expect(component.application()).toEqual(mockApplication);
      expect(component.reviewers()).toEqual(
        mockReviewers.filter((user) => user.role === 'REVIEWER'),
      );
      expect(component.reviews()).toEqual([mockReview]);
      expect(component.loading()).toBe(false);
    });

    it('should not load the application for a sales user', () => {
      initialize();

      expectCurrentUserRequest(salesUser);

      expect(component.loading()).toBe(false);
      expect(component.error()).toBe(
        'Access denied. Only admins and reviewers can use this page.',
      );

      httpTestingController.expectNone(`${apiUrl}/${applicationId}`);
      httpTestingController.expectNone(`${authUrl}/api/users?role=REVIEWER`);
    });

    it('should show a session-expired message when current-user request returns 401', () => {
      initialize();

      httpTestingController
        .expectOne(`${authUrl}/me`)
        .flush(
          { message: 'Unauthorized' },
          { status: 401, statusText: 'Unauthorized' },
        );

      expect(component.loading()).toBe(false);
      expect(component.error()).toBe(
        'Your session has expired. Please log in again.',
      );
    });

    it('should show a verification error for other current-user failures', () => {
      initialize();

      httpTestingController
        .expectOne(`${authUrl}/me`)
        .flush(
          { message: 'Server error' },
          { status: 500, statusText: 'Server Error' },
        );

      expect(component.loading()).toBe(false);
      expect(component.error()).toBe('Unable to verify your user account.');
    });
  });

  describe('application loading', () => {
    it('should load and store the application', () => {
      initialize();

      expectCurrentUserRequest(reviewerUser);
      expectApplicationRequest();

      expect(component.application()).toEqual(mockApplication);
      expect(component.loading()).toBe(false);
      expect(component.assignmentForm.controls.reviewerId.value).toBe(
        'reviewer-1',
      );

      expectReviewsRequest();
    });

    it('should fall back to reviewer_id when assigned_reviewer_id is absent', () => {
      const application = {
        ...mockApplication,
        assigned_reviewer_id: undefined,
        reviewer_id: 'reviewer-2',
      } as Application;

      initialize();

      expectCurrentUserRequest(reviewerUser);
      expectApplicationRequest(application);

      expect(component.assignmentForm.controls.reviewerId.value).toBe(
        'reviewer-2',
      );

      expectReviewsRequest();
    });

    it('should set an empty reviewer ID when no reviewer is assigned', () => {
      const application = {
        ...mockApplication,
        assigned_reviewer_id: undefined,
        reviewer_id: undefined,
      } as Application;

      initialize();

      expectCurrentUserRequest(reviewerUser);
      expectApplicationRequest(application);

      expect(component.assignmentForm.controls.reviewerId.value).toBe('');
      expectReviewsRequest();
    });

    it('should handle an application-not-found response', () => {
      initialize();

      expectCurrentUserRequest(reviewerUser);

      httpTestingController
        .expectOne(`${apiUrl}/${applicationId}`)
        .flush(
          { message: 'Not found' },
          { status: 404, statusText: 'Not Found' },
        );

      expect(component.loading()).toBe(false);
      expect(component.error()).toBe(
        'Application not found, or you do not have permission to access it.',
      );
    });

    it('should handle an application-loading server error', () => {
      initialize();

      expectCurrentUserRequest(reviewerUser);

      httpTestingController
        .expectOne(`${apiUrl}/${applicationId}`)
        .flush(
          { message: 'Server error' },
          { status: 500, statusText: 'Server Error' },
        );

      expect(component.loading()).toBe(false);
      expect(component.error()).toBe('Failed to load application details.');
    });
  });

  describe('reviewer loading', () => {
    it('should load only users with the REVIEWER role', () => {
      initialize();

      expectCurrentUserRequest(adminUser);
      expectApplicationRequest();

      const users = [...mockReviewers];

      expectReviewersRequest(users);

      expect(component.reviewers()).toHaveLength(2);
      expect(
        component.reviewers().every((user) => user.role === 'REVIEWER'),
      ).toBe(true);

      expectReviewsRequest();
    });

    it('should support an array response from the reviewers endpoint', () => {
      initialize();

      expectCurrentUserRequest(adminUser);
      expectApplicationRequest();

      httpTestingController
        .expectOne(`${authUrl}/api/users?role=REVIEWER`)
        .flush(mockReviewers);

      expect(component.reviewers()).toHaveLength(2);

      expectReviewsRequest();
    });

    it('should handle an empty reviewers response', () => {
      initialize();

      expectCurrentUserRequest(adminUser);
      expectApplicationRequest();
      expectReviewersRequest([]);

      expect(component.reviewers()).toEqual([]);

      expectReviewsRequest();
    });

    it('should handle a reviewers endpoint error', () => {
      initialize();

      expectCurrentUserRequest(adminUser);
      expectApplicationRequest();

      httpTestingController
        .expectOne(`${authUrl}/api/users?role=REVIEWER`)
        .flush(
          { message: 'Server error' },
          { status: 500, statusText: 'Server Error' },
        );

      expect(component.loadingReviewers()).toBe(false);
      expect(component.error()).toContain('Unable to load reviewers.');

      expectReviewsRequest();
    });
  });

  describe('review history', () => {
    it('should load and store review history', () => {
      initializeReviewer();

      expect(component.reviews()).toEqual([mockReview]);
      expect(component.loadingReviews()).toBe(false);
    });

    it('should not load review history without an application', () => {
      component.loadReviews();

      expect(component.loadingReviews()).toBe(false);
      httpTestingController.expectNone(`${apiUrl}/${applicationId}/reviews`);
    });

    it('should handle a review-history error', () => {
      initialize();

      expectCurrentUserRequest(reviewerUser);
      expectApplicationRequest();

      httpTestingController
        .expectOne(`${apiUrl}/${applicationId}/reviews`)
        .flush(
          { message: 'Server error' },
          { status: 500, statusText: 'Server Error' },
        );

      expect(component.loadingReviews()).toBe(false);
      expect(component.error()).toContain('Unable to load review history.');
    });

    it('should handle a 401 response when loading review history', () => {
      initialize();

      expectCurrentUserRequest(reviewerUser);
      expectApplicationRequest();

      httpTestingController
        .expectOne(`${apiUrl}/${applicationId}/reviews`)
        .flush(
          { message: 'Unauthorized' },
          { status: 401, statusText: 'Unauthorized' },
        );

      expect(component.loadingReviews()).toBe(false);
      expect(component.error()).toBe(
        'Your session has expired. Please log in again.',
      );
    });
  });

  describe('reviewer assignment', () => {
    beforeEach(() => {
      initializeAdmin();

      component.currentUser.set(adminUser);
      component.application.set(mockApplication);
      component.reviewers.set(mockReviewers);
      component.assignmentForm.controls.reviewerId.setValue('reviewer-1');
    });

    it('should detect an unchanged reviewer assignment', () => {
      expect(component.selectedReviewerUnchanged()).toBe(true);
    });

    it('should detect a changed reviewer assignment', () => {
      component.assignmentForm.controls.reviewerId.setValue('reviewer-2');

      expect(component.selectedReviewerUnchanged()).toBe(false);
    });

    it('should treat an unassigned application as unchanged when the selection is empty', () => {
      component.application.set({
        ...mockApplication,
        assigned_reviewer_id: undefined,
        reviewer_id: undefined,
      } as Application);

      component.assignmentForm.controls.reviewerId.setValue('');

      expect(component.selectedReviewerUnchanged()).toBe(true);
    });

    it('should consider the assignment unchanged when no application is loaded', () => {
      component.application.set(null);

      expect(component.selectedReviewerUnchanged()).toBe(true);
    });

    it('should open a confirmation before reassigning a reviewer', () => {
      component.assignmentForm.controls.reviewerId.setValue('reviewer-2');

      component.reassignReviewer();

      expect(component.showConfirmModal()).toBe(true);
      expect(component.confirmTitle()).toBe('Confirm Reviewer Assignment');
      expect(component.confirmMessage()).toBe(
        'Reassign this application to John Reviewer?',
      );
      expect(component.confirmAction()).toBe('REASSIGN');
    });

    it('should show Unassigned when removing the current reviewer', () => {
      component.assignmentForm.controls.reviewerId.setValue('');

      component.reassignReviewer();

      expect(component.showConfirmModal()).toBe(true);
      expect(component.confirmMessage()).toBe(
        'Reassign this application to Unassigned?',
      );
    });

    it('should not open a confirmation for a non-admin', () => {
      component.currentUser.set(reviewerUser);
      component.assignmentForm.controls.reviewerId.setValue('reviewer-2');

      component.reassignReviewer();

      expect(component.showConfirmModal()).toBe(false);
    });

    it('should not open a confirmation when the reviewer is unchanged', () => {
      component.reassignReviewer();

      expect(component.showConfirmModal()).toBe(false);
    });

    it('should not open a confirmation while assignment is saving', () => {
      component.assignmentForm.controls.reviewerId.setValue('reviewer-2');
      component.savingAssignment.set(true);

      component.reassignReviewer();

      expect(component.showConfirmModal()).toBe(false);
    });

    it('should save a confirmed reviewer reassignment', () => {
      // The suite's beforeEach already initialized the component as admin.
      component.assignmentForm.controls.reviewerId.setValue('reviewer-2');

      component.reassignReviewer();

      expect(component.showConfirmModal()).toBe(true);
      expect(component.confirmAction()).toBe('REASSIGN');

      component.confirmActionNow();

      expect(component.showConfirmModal()).toBe(false);
      expect(component.confirmAction()).toBeNull();
      expect(component.savingAssignment()).toBe(true);

      const request = httpTestingController.expectOne(
        `${apiUrl}/${encodeURIComponent(applicationId)}`,
      );

      expect(request.request.method).toBe('PATCH');
      expect(request.request.body).toEqual({
        assigned_reviewer_id: 'reviewer-2',
      });

      request.flush({
        data: {
          ...mockApplication,
          assigned_reviewer_id: 'reviewer-2',
          assigned_reviewer_name: 'John Reviewer',
        },
      });

      expect(component.savingAssignment()).toBe(false);
      expect(component.assignmentForm.controls.reviewerId.value).toBe(
        'reviewer-2',
      );
      expect(component.success()).toBe('Reviewer reassigned to John Reviewer.');
      expect(component.error()).toBe('');
    });

    it('should remove a reviewer assignment when confirmed', () => {
      // The suite's beforeEach already initialized the component as admin.
      component.assignmentForm.controls.reviewerId.setValue('');

      component.reassignReviewer();

      expect(component.showConfirmModal()).toBe(true);
      expect(component.confirmAction()).toBe('REASSIGN');

      component.confirmActionNow();

      const request = httpTestingController.expectOne(
        `${apiUrl}/${encodeURIComponent(applicationId)}`,
      );

      expect(request.request.method).toBe('PATCH');
      expect(request.request.body).toEqual({
        assigned_reviewer_id: null,
      });

      request.flush({
        data: {
          ...mockApplication,
          assigned_reviewer_id: null,
          reviewer_id: null,
        },
      });

      expect(component.savingAssignment()).toBe(false);
      expect(component.success()).toBe('Reviewer assignment removed.');
      expect(component.error()).toBe('');
    });

    it('should handle a forbidden reassignment', () => {
      component.assignmentForm.controls.reviewerId.setValue('reviewer-2');
      component.reassignReviewer();
      component.confirmActionNow();

      httpTestingController
        .expectOne(`${apiUrl}/${applicationId}`)
        .flush(
          { message: 'Forbidden' },
          { status: 403, statusText: 'Forbidden' },
        );

      expect(component.savingAssignment()).toBe(false);
      expect(component.error()).toBe(
        'Only administrators can reassign reviewers.',
      );
    });

    it('should handle an invalid reviewer assignment', () => {
      component.assignmentForm.controls.reviewerId.setValue('reviewer-2');
      component.reassignReviewer();
      component.confirmActionNow();

      httpTestingController
        .expectOne(`${apiUrl}/${applicationId}`)
        .flush(
          { message: 'Invalid reviewer' },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(component.savingAssignment()).toBe(false);
      expect(component.error()).toBe('Invalid reviewer');
    });

    it('should handle a failed reassignment with a generic error', () => {
      component.assignmentForm.controls.reviewerId.setValue('reviewer-2');
      component.reassignReviewer();
      component.confirmActionNow();

      httpTestingController
        .expectOne(`${apiUrl}/${applicationId}`)
        .flush({}, { status: 500, statusText: 'Server Error' });

      expect(component.savingAssignment()).toBe(false);
      expect(component.error()).toBe(
        'Failed to reassign the reviewer. Please try again.',
      );
    });
  });

  describe('review decision submission', () => {
    beforeEach(() => {
      initializeAdmin();

      component.currentUser.set(adminUser);
      component.application.set(mockApplication);
      component.reviewers.set(mockReviewers);
    });

    it('should open a confirmation for an approval', () => {
      component.reviewForm.controls.decision.setValue('APPROVE');

      component.submitReview();

      expect(component.showConfirmModal()).toBe(true);
      expect(component.confirmTitle()).toBe('Confirm Review Decision');
      expect(component.confirmMessage()).toBe(
        'Are you sure you want to approve this application?',
      );
      expect(component.confirmAction()).toBe('REVIEW');
    });

    it('should require comments for a rejection', () => {
      component.reviewForm.controls.decision.setValue('REJECT');
      component.reviewForm.controls.comments.setValue('   ');

      component.submitReview();

      expect(component.showConfirmModal()).toBe(false);
      expect(component.error()).toBe(
        'Please provide comments explaining the rejection.',
      );
      expect(component.reviewForm.controls.comments.touched).toBe(true);
    });

    it('should require comments when requesting additional information', () => {
      component.reviewForm.controls.decision.setValue('REQUEST_INFO');
      component.reviewForm.controls.comments.setValue('');

      component.submitReview();

      expect(component.showConfirmModal()).toBe(false);
      expect(component.error()).toBe(
        'Please specify what additional information is required.',
      );
    });

    it('should open a confirmation for a rejection with comments', () => {
      component.reviewForm.controls.decision.setValue('REJECT');
      component.reviewForm.controls.comments.setValue('Insufficient documents');

      component.submitReview();

      expect(component.showConfirmModal()).toBe(true);
      expect(component.confirmMessage()).toBe(
        'Are you sure you want to reject this application?',
      );
    });

    it('should open a confirmation for a request for information', () => {
      component.reviewForm.controls.decision.setValue('REQUEST_INFO');
      component.reviewForm.controls.comments.setValue(
        'Please provide bank statements',
      );

      component.submitReview();

      expect(component.showConfirmModal()).toBe(true);
      expect(component.confirmMessage()).toBe(
        'Are you sure you want to request additional information for this application?',
      );
    });

    it('should not submit a review when the user cannot review', () => {
      component.currentUser.set(salesUser);

      component.submitReview();

      expect(component.showConfirmModal()).toBe(false);
      expect(component.reviewForm.touched).toBe(true);
    });

    it('should not open a confirmation while a review is submitting', () => {
      component.submitting.set(true);

      component.submitReview();

      expect(component.showConfirmModal()).toBe(false);
    });

    it('should submit an approved decision after confirmation', () => {
      component.reviewForm.controls.decision.setValue('APPROVE');
      component.reviewForm.controls.comments.setValue('  Looks good  ');

      component.submitReview();
      component.confirmActionNow();

      expect(component.submitting()).toBe(true);
      expect(component.showConfirmModal()).toBe(false);

      const request = httpTestingController.expectOne(
        `${apiUrl}/${applicationId}/reviews`,
      );

      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({
        decision: 'APPROVE',
        comments: 'Looks good',
      });

      const response = {
        data: {
          ...mockApplication,
          application_status: 'APPROVED',
          risk_status: 'APPROVED',
        },
        review: mockReview,
        message: 'Review decision submitted successfully.',
      } as ReviewSubmissionResponse;

      request.flush(response);

      expect(component.submitting()).toBe(false);
      expect(component.application()?.application_status).toBe('APPROVED');
      expect(component.reviews()[0]).toEqual(mockReview);
      expect(component.success()).toBe(
        'Review decision submitted successfully.',
      );

      // Successful submission reloads the review history.
      expectReviewsRequest([mockReview]);

      expect(component.loadingReviews()).toBe(false);
      expect(component.reviewForm.controls.decision.value).toBe('APPROVE');
      expect(component.reviewForm.controls.comments.value).toBe('');
    });

    it('should handle a forbidden review decision', () => {
      component.reviewForm.controls.decision.setValue('APPROVE');
      component.submitReview();
      component.confirmActionNow();

      httpTestingController
        .expectOne(`${apiUrl}/${applicationId}/reviews`)
        .flush(
          { message: 'Forbidden' },
          { status: 403, statusText: 'Forbidden' },
        );

      expect(component.submitting()).toBe(false);
      expect(component.error()).toBe(
        'You are not permitted to submit this review decision.',
      );
    });

    it('should handle a review decision API validation error', () => {
      component.reviewForm.controls.decision.setValue('APPROVE');
      component.submitReview();
      component.confirmActionNow();

      httpTestingController
        .expectOne(`${apiUrl}/${applicationId}/reviews`)
        .flush(
          { message: 'Invalid decision' },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(component.submitting()).toBe(false);
      expect(component.error()).toBe('Invalid decision');
    });

    it('should handle a failed review decision request', () => {
      component.reviewForm.controls.decision.setValue('APPROVE');
      component.submitReview();
      component.confirmActionNow();

      httpTestingController
        .expectOne(`${apiUrl}/${applicationId}/reviews`)
        .flush({}, { status: 500, statusText: 'Server Error' });

      expect(component.submitting()).toBe(false);
      expect(component.error()).toBe('Failed to submit the review decision.');
    });

    it('should handle a 401 response when submitting a review decision', () => {
      component.reviewForm.controls.decision.setValue('APPROVE');
      component.submitReview();
      component.confirmActionNow();

      httpTestingController
        .expectOne(`${apiUrl}/${applicationId}/reviews`)
        .flush(
          { message: 'Unauthorized' },
          { status: 401, statusText: 'Unauthorized' },
        );

      expect(component.submitting()).toBe(false);
      expect(component.error()).toBe(
        'Your session has expired. Please log in again.',
      );
    });
  });

  describe('confirmation modal', () => {
    it('should close the confirmation when cancelled', () => {
      component.showConfirmModal.set(true);
      component.confirmAction.set('REVIEW');

      component.cancelConfirmation();

      expect(component.showConfirmModal()).toBe(false);
      expect(component.confirmAction()).toBeNull();
    });

    it('should not cancel while an assignment is saving', () => {
      component.showConfirmModal.set(true);
      component.confirmAction.set('REASSIGN');
      component.savingAssignment.set(true);

      component.cancelConfirmation();

      expect(component.showConfirmModal()).toBe(true);
      expect(component.confirmAction()).toBe('REASSIGN');
    });

    it('should not cancel while a review is submitting', () => {
      component.showConfirmModal.set(true);
      component.confirmAction.set('REVIEW');
      component.submitting.set(true);

      component.cancelConfirmation();

      expect(component.showConfirmModal()).toBe(true);
      expect(component.confirmAction()).toBe('REVIEW');
    });

    it('should do nothing when there is no confirmed action', () => {
      component.showConfirmModal.set(true);
      component.confirmAction.set(null);

      component.confirmActionNow();

      expect(component.showConfirmModal()).toBe(true);
      expect(component.confirmAction()).toBeNull();
    });
  });
});
