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
      email: new FormControl('', [Validators.required]),
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
      isPwd: step2Data.isPwd,
      isHouseEmployee: step2Data.isHouseEmployee
    }
  }
}
