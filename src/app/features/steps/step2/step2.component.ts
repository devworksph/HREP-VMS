import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpEventType, HttpHeaders, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { FormWizardService } from '~core/components/form-wizard/form-wizard.service';
import { FormWizardStepBaseComponent } from '~core/components/form-wizard/form-wizard-step-base.component';
import { CookieService } from 'ngx-cookie-service';
import { AccordionModule } from 'primeng/accordion';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';
import { CheckboxModule } from 'primeng/checkbox';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { DateTime } from 'luxon';
import { environment } from '~environments/environment';

@Component({
  selector: 'step2',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AccordionModule,
    InputTextModule,
    IftaLabelModule,
    CheckboxModule,
    FileUploadModule,
    SelectModule,
    ProgressBarModule,
    ProgressSpinnerModule,
    DialogModule,
    ButtonModule,
    CommonModule,
    FormsModule
  ],
  providers: [
    CookieService
  ],
  templateUrl: './step2.component.html',
  styleUrl: './step2.component.scss',
})
export class Step2Component extends FormWizardStepBaseComponent {
  public step1Data: any;
  public isFileUploading: boolean = false;
  public isCsvFileUploading: boolean = false;
  public uploadedFiles: any[] = [];
  public ageRange = [
    { name: '7-18', value: '7 - 18'},
    { name: '19-35', value: '19 - 35'},
    { name: '36-59', value: '36 - 59'},
    { name: '60-Above', value: '60 - Above'},
  ];
  public sex = [
    { name: 'Male', value: 'Male'},
    { name: 'Female', value: 'Female'},
    { name: 'Prefer not to say', value: 'Prefer not to say'},
  ];
  public apiUrl: string = '';
  public vmsCmsUrl: string = '';
  public maxFileSize = 10; // 10mb
  public uploadProgress = 0;
  public uploadMessage = '';
  public uploadMessageCsv = '';
  public displayModal: boolean = false;
  public showPrivacyPolicyModal = true;
  public hasReadNotice = false;
  public hasGivenConsent = false;
  public hasConsented = true;

  constructor(
    private wizardService: FormWizardService,
    private cookieService: CookieService,
    private http: HttpClient
  ) {
    const formcontrols = {
      lastName: new FormControl('', [Validators.required]),
      firstName: new FormControl('', [Validators.required]),
      middleName: new FormControl(null, [Validators.required]),
      ageRange: new FormControl(null, [Validators.required]),
      sex: new FormControl(null, [Validators.required]),
      isSoloParent: new FormControl(''),
      isHouseEmployee: new FormControl(''),
      uploadedIdFileName: new FormControl(null, [Validators.required])
    };
    super(2, wizardService.getSteps(), true, formcontrols);
  }

  ngOnInit() {
    if (this.cookieService.get('user_consent_vms')) {
      this.showPrivacyPolicyModal = false;
    }
    this.apiUrl = environment.apiBaseUrl;
    this.vmsCmsUrl = environment.vmsCmsBaseUrl;
    const step1Data = this.wizardService.getStepData(1);
    const date = DateTime.fromJSDate(step1Data.date);
    const formattedDate = date.toFormat('MMMM dd, yyyy');
    const slotTime = step1Data.timeSlot.split('-')[1];

    this.step1Data = {
      location: step1Data.location.split(':')[0],
      date: `${formattedDate} - ${slotTime}`,
      visitor_type: step1Data.visitorType,
      booking_type: step1Data.bookingType,
      student_type: step1Data.studentType,
      province: step1Data.selectedProvince,
      municipality: step1Data.selectedMunicipality,
      country_of_origin: step1Data.countryOfOrigin,
    };
  }

  onBeforeUpload(event: any) {
    this.isFileUploading = true;
    this.uploadMessage = '';
  }

  onUploadSuccess(event: any) {
    this.isFileUploading = false;
    this.uploadMessage = 'File upload successful!';

    const response = event.originalEvent?.body;

    if (response && response.status === 'success') {
      const fileName = response.file_name;
      const fileUrl = response.url;

      console.log('File name:', fileName);
      console.log('File URL:', fileUrl);

      this.form.patchValue({
        uploadedIdFileName: fileName
      })

      // You can store it in a variable if needed
      // this.uploadedFileName = fileName;
      // this.uploadedFileUrl = fileUrl;
    }
  }

  onUploadError(event: any) {
    this.isFileUploading = false;
    this.uploadMessage = 'File upload failed.';
  }

   onBeforeUploadCsv(event: any) {
    this.isFileUploading = true;
    this.uploadMessageCsv = '';
  }

  onUploadSuccessCsv(event: any) {
    this.isFileUploading = false;
    this.uploadMessageCsv = 'File upload successful!';
  }

  onUploadErrorCsv(event: any) {
    this.isFileUploading = false;
    this.uploadMessageCsv = 'File upload failed.';
  }

  onOpenPrivacyPolicy() {
    this.showPrivacyPolicyModal = true;
  }

  agreeAndContinue() {
    if (this.hasReadNotice && this.hasGivenConsent) {
      this.hasConsented = true;
      this.cookieService.set('user_consent_vms', 'true', 1, '/');
      this.showPrivacyPolicyModal = false;
    } else {
      this.hasConsented = false;
    }
  }

  declineAndExit() {
    this.cookieService.delete('user_consent_vms');
    this.showPrivacyPolicyModal = false;
  }
}
