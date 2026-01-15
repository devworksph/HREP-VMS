import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { DateTime } from 'luxon';
import { environment } from '~environments/environment';
import { ILocation } from '~features/steps/model/locations.model';
import { ISchedule, IScheduleResponse } from '~features/steps/model/schedules.model';
import { IPrivacyPolicy } from '~features/steps/model/settings.model';

@Injectable({
  providedIn: 'root'
})

export class StrapiService {
  private apiUrl = environment.apiBaseUrl;
  private locations$?: Observable<ILocation[]>;
  private privacyPolicy$?: Observable<IPrivacyPolicy>;

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
  
  getPrivacyPolicy(): Observable<IPrivacyPolicy> {
    if (!this.privacyPolicy$) {
      this.privacyPolicy$ = this.http.get<any>(`${this.apiUrl}/privacy-policy`).pipe(
        map(res => res.privacy_policy),
        shareReplay(1)
      );
    }

    return this.privacyPolicy$;
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
    let visitorId = 0;
    let token = 0;

    console.log('data', data);
    return this.http.post<any>(`${this.apiUrl}/create/visitor`, data, {
      headers,
      observe: 'response'
    }).pipe(
      switchMap(res => {
        console.log('XXX', res);
        if (res.status === 200) {
          visitorId = res.body.visitor_id;

          return this.http.post<any>(`https://housepass-uat.hrep.online/api/auth/login`, {
            "hrep_id": "ML001",
            "password": "HR3P@MUS3UM"
          });
        } else {
          throw new Error(`Unexpected status code: ${res.status}`);
        }
      }),
      switchMap((loginRes: any) => {
        console.log('datata', data);
        console.log('loginRes', loginRes);
        const date = DateTime.fromJSDate(data.date);
        const formattedDate = date.toFormat('yyyy-MM-dd');
        const location = data.location.split(':')[0];

        token = loginRes?.access_token;
        if (!token) throw new Error('No access token received');

        const authHeaders = new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        });

        const dataForm = {
          "data": {
              "booking_details": {
                  "visit_date": formattedDate,
                  "visit_area": location,
                  "visit_purpose": data.purposeOfVisit
              },
              "visitors": [
                  {
                      "id": visitorId,
                      "first_name": data.firstName,
                      "last_name": data.lastName,
                      "email": data.email,
                      "mobile_number": data.mobileNo,
                      "valid_id_image":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAACQCAIAAAC2QK5eAAABFElEQVR4nO3PAQEAAAgDIN8/9K3hABUBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
                  }
              ]
          }
        };

        return this.http.post<any>(`https://housepass-uat.hrep.online/api/museum/register-visitor`, dataForm, {
          headers: authHeaders
        });
      })
      // map(res => {
      //   if (res.status === 200) {
      //     return res;
      //   } else {
      //     throw new Error(`Unexpected status code: ${res.status}`);
      //   }
      // })
    );
  }
}
