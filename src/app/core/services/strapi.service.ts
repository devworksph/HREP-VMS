import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '~environments/environment';

@Injectable({
  providedIn: 'root'
})

export class StrapiService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // Get all locations
  getLocations(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/locations`);
  }

  // get schedules
  getSchedules(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/hor-schedules`);
  }

  createVisitor(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return this.http.post(`${this.apiUrl}/visitors-lists`, data, { headers });
  }
}
