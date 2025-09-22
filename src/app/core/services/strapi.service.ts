import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from '~environments/environment';
import { ILocation } from '~features/steps/model/locations.model';
import { ISchedule, IScheduleResponse } from '~features/steps/model/schedules.model';

@Injectable({
  providedIn: 'root'
})

export class StrapiService {
  private apiUrl = environment.apiBaseUrl;
  private locations$?: Observable<ILocation[]>;

  constructor(private http: HttpClient) {}

  getLocations(): Observable<ILocation[]> {
    if (!this.locations$) {
      this.locations$ = this.http.get<any>(`${this.apiUrl}/locations`).pipe(
        map(res => res.locations),
        shareReplay(1)
      );
    }

    return this.locations$;
  }

  getSchedules(data: any): Observable<IScheduleResponse[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<any>(`${this.apiUrl}/schedules`, data, {
      headers,
      observe: 'response'
    }).pipe(
      map(res => {
        if (res.status === 200) {
          return res.body.schedules;
        } else {
          throw new Error(`Unexpected status code: ${res.status}`);
        }
      })
    );
  }

  createVisitor(data: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<any>(`${this.apiUrl}/create/visitor`, data, {
      headers,
      observe: 'response'
    }).pipe(
      map(res => {
        if (res.status === 200) {
          return res;
        } else {
          throw new Error(`Unexpected status code: ${res.status}`);
        }
      })
    );
  }
}
