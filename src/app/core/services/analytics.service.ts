import { Injectable } from '@angular/core';
import { httpResource, type HttpResourceRef } from '@angular/common/http';
import { getEndpoints } from '~core/constants/endpoints.constants';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly endpoints = getEndpoints();

  getRealtimeUsersResource() {
    return false;''
  }
}
