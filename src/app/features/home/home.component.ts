import { ChangeDetectionStrategy, Component, effect, inject, ChangeDetectorRef } from '@angular/core';
import { interval } from 'rxjs';
import { AnalyticsService } from '~core/services/analytics.service';
import { FormWizardComponent } from '~core/components/form-wizard/form-wizard.component';
import { IStepperOptions, IWizardStep } from '~core/components/form-wizard/form-wizard.model';
import { FormWizardService } from '~core/components/form-wizard/form-wizard.service';
import { StrapiService } from '~core/services/strapi.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button'; // For buttons inside the dialog
import { Step1Component } from '../steps/step1/step1.component';
import { Step2Component } from '../steps/step2/step2.component';
import { Step3Component } from '../steps/step3/step3.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormWizardComponent,
    DialogModule,
    ButtonModule
  ],
})
export class HomeComponent {
  private readonly analyticsService = inject(AnalyticsService);
  readonly activeUsersResource = this.analyticsService.getRealtimeUsersResource();
  public displaySuccessDialog: boolean = false;

  public steps: IWizardStep[] = [
    {
      id: 1,
      title: 'Schedule and Booking Type',
      description: 'Check available dates',
      data: null,
      component: Step1Component
    },
    {
      id: 2,
      title: 'Registration',
      description: 'Visitor Details',
      data: null,
      component: Step2Component
    },
    {
      id: 3,
      title: 'Review Details',
      description: 'Check details provided',
      data: null,
      component: Step3Component
    }
  ];

  public stepperOptions: IStepperOptions = {
    custom: true,
    position: 'top'
  };

  constructor(
    private WizardService: FormWizardService,
    private StrapiService: StrapiService,
    private ChangeDetectorRef: ChangeDetectorRef
  ) {}

  onFinish(): void {
    const allStepData = this.WizardService.getAllStepData();
    const step1Data = allStepData[1];
    const step2Data = allStepData[2];
    const step3Data = allStepData[3];

    const formData = {
      data: {
        visitor_type: step1Data.visitorType,
        booking_type: step1Data.bookingType,
        municipality: step1Data.municipalities,
        country_of_origin: step1Data.countryOfOrigin,
        first_name: step2Data.firstName,
        middle_name: step2Data.middleName,
        last_name: step2Data.lastName,
        age_range: step2Data.ageRange,
        email: step3Data.email,
        mobile_no: step3Data.mobileNo,
        location_id: step1Data.location.split(':')[0],
      }
    };

    this.StrapiService.createVisitor(formData).subscribe(
      response => {
        this.displaySuccessDialog = true;
        console.log('creation of visitor successfull');

        this.ChangeDetectorRef.detectChanges();
        
      },
      error => {

      }
    );

    console.log(allStepData);
  }

  onCancel(): void {
    alert('Wizard Cancelled!!');
  }

  closeSuccessDialog() {
    window.location.reload();
  }
}
