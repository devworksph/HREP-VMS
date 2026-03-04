import { Pipe, PipeTransform } from '@angular/core';
import { IScheduleResponse } from '../model/schedules.model';

@Pipe({ name: 'timePeriodFilter' })
export class TimePeriodFilterPipe implements PipeTransform {
  transform(schedules: IScheduleResponse[] = [], period: 'AM' | 'PM'): IScheduleResponse[] {
    if (!Array.isArray(schedules) || !period) return schedules;

    return schedules.filter(s => {
      if (!s.time) return false;

      const hour = Number(s.time.split(':')[0]); // get hour from "HH:mm"
      if (isNaN(hour)) return false;

      // 12:00 is noon (PM), 00:00 is midnight (AM)
      return period === 'AM' ? hour < 12 : hour >= 12;
    });
  }
}
