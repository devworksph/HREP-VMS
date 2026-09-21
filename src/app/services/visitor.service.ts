import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AvailabilityResponse, CreateVisitorResponse, HolidaysResponse, PrivacyPolicyResponse, RemindersResponse, SlotsResponse } from '@models/api.model';

@Injectable({
  providedIn: 'root'
})

export class VisitorService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  createVisitor(data: any): Observable<CreateVisitorResponse> {
    return this.http.post<CreateVisitorResponse>(`${this.apiUrl}/create/visitor`, data);
  }

  reminders(params: any): Observable<RemindersResponse> {
    return this.http.get<RemindersResponse>(`${this.apiUrl}/reminders`, { params });
  }

  holidays(): Observable<HolidaysResponse> {
    return this.http.get<HolidaysResponse>(`${this.apiUrl}/holidays`);
  }

  availability(location: string): Observable<AvailabilityResponse> {
    return this.http.get<AvailabilityResponse>(`${this.apiUrl}/availability`, { params: { location } });
  }

  slots(location: string, date: string): Observable<SlotsResponse> {
    return this.http.get<SlotsResponse>(`${this.apiUrl}/slots`, { params: { location, date } });
  }

  privacyNotice(): Observable<PrivacyPolicyResponse> {
    return this.http.get<PrivacyPolicyResponse>(`${this.apiUrl}/privacy-policy`);
  }
}