import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormService {
  private formGroupSubject = new BehaviorSubject<FormGroup | null>(null);

  setFormGroup(formGroup: FormGroup) {
    this.formGroupSubject.next(formGroup);
  }

  getFormGroup() {
    return this.formGroupSubject.asObservable();
  }
}