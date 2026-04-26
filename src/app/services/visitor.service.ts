import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { DateTime } from 'luxon';
import { environment } from 'src/environments/environment';
// import { environment } from '~environments/environment';
// import { ILocation } from '~features/steps/model/locations.model';
// import { ISchedule, IScheduleResponse } from '~features/steps/model/schedules.model';
// import { IPrivacyPolicy } from '~features/steps/model/settings.model';

@Injectable({
  providedIn: 'root'
})

export class VisitorService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  createVisitor(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create/visitor`, data);
  }

  reminders(params: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reminders`, { params });
  }
}