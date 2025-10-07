import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormWizardService } from '~core/components/form-wizard/form-wizard.service';
import { FormWizardStepBaseComponent } from '~core/components/form-wizard/form-wizard-step-base.component';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';
import { DateTime } from 'luxon';
import { last } from 'rxjs';

@Component({
  selector: 'step3',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    IftaLabelModule
  ],
  templateUrl: './step3.component.html',
})
export class Step3Component extends FormWizardStepBaseComponent {
  public step1Data: any;
  public step2Data: any;

  constructor(private wizardService: FormWizardService) {
    const formcontrols = {
      email: new FormControl('', [Validators.required, Validators.email]),
      mobileNo: new FormControl('', [Validators.required])
    };
    super(3, wizardService.getSteps(), true, formcontrols);
  }

  ngOnInit() {
    const step1Data = this.wizardService.getStepData(1);
    const step2Data = this.wizardService.getStepData(2);

    const date = DateTime.fromJSDate(step1Data.date);
    const formattedDate = date.toFormat('MMMM dd, yyyy');
    const slotTime = step1Data.timeSlot.split('-')[1];
    const allStepData = this.wizardService.getAllStepData();

    console.log('all', allStepData);
    this.step1Data = {
      location: step1Data.location.split(':')[0],
      date: `${formattedDate} - ${slotTime}`,
      visitor_type: step1Data.visitorType,
      booking_type: step1Data.bookingType,
      student_type: step1Data.studentType,
      municipality: step1Data.municipalities,
      countryOfOrigin: step1Data.countryOfOrigin,
    }

    this.step2Data = {
      lastName: step2Data.lastName,
      firstName: step2Data.firstName,
      middleName: step2Data.middleName,
      ageRange: step2Data.ageRange,
      isSoloParent: step2Data.isSoloParent,
      isHouseEmployee: step2Data.isHouseEmployee
    }
  }

  onMobileBlur(): void {
    const control = this.form.get('mobileNo');
    if (!control) return;

    const value = control.value?.trim();
    if (!value) return;

    const normalized = this.normalizeToE164(value);

    // Validate if it has exactly 10 digits after +63
    const isPH = normalized.startsWith('+63');
    const digitsOnly = normalized.replace(/\D/g, '');
    const localPart = isPH ? digitsOnly.slice(2) : digitsOnly; // remove '63'

    if (isPH && localPart.length !== 10) {
      control.setErrors({ invalidLength: true });
    } else {
      control.setErrors(null);
      control.setValue(normalized, { emitEvent: false });
    }
  }

  normalizeToE164(number: string): string {
    if (!number) return '';
    number = number.replace(/[\s\-()]/g, '');

    if (number.startsWith('+')) return number;
    if (number.startsWith('00')) return '+' + number.slice(2);
    if (number.startsWith('0')) return '+63' + number.slice(1);
    return '+63' + number; // fallback if no prefix
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  limitToTenDigits(event: any): void {
    let value = event.target.value.replace(/\D/g, '');

    // Remove the +63 if user manually types it
    if (value.startsWith('63')) value = value.slice(2);
    if (value.startsWith('0')) value = value.slice(1);

    // Limit to 10 digits
    if (value.length > 10) value = value.slice(0, 10);

    event.target.value = '+63' + value;
    this.form.get('mobileNo')?.setValue(event.target.value, { emitEvent: false });
  }
}
