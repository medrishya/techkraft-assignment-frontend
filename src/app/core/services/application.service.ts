import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Application,
  ApplicationFilters,
  ApplicationsResponse,
} from '../../features/applications/models/application.model';

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/applications';

  getApplications(
    filters: ApplicationFilters,
  ): Observable<ApplicationsResponse> {
    let params = new HttpParams()
      .set('page', filters.page)
      .set('limit', filters.limit);

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    if (filters.application_status) {
      params = params.set('application_status', filters.application_status);
    }

    if (filters.risk_status) {
      params = params.set('risk_status', filters.risk_status);
    }

    return this.http.get<ApplicationsResponse>(this.apiUrl, { params });
  }

  deleteApplication(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(id)}`);
  }
}
