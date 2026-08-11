import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

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

  privacyNotice(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/privacy-policy`);
  }
}