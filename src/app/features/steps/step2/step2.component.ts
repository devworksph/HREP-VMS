import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpEventType, HttpHeaders, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormWizardService } from '~core/components/form-wizard/form-wizard.service';
import { FormWizardStepBaseComponent } from '~core/components/form-wizard/form-wizard-step-base.component';
import { AccordionModule } from 'primeng/accordion';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';
import { CheckboxModule } from 'primeng/checkbox';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
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
    ProgressSpinnerModule
  ],
  templateUrl: './step2.component.html',
  styleUrl: './step2.component.scss',
})
export class Step2Component extends FormWizardStepBaseComponent {
  public step1Data: any;
  public isUploading: boolean = false;
  public uploadedFiles: any[] = [];
  public ageRange = [
    { name: '7-18', value: '7-18'},
    { name: '19-35', value: '19-35'},
    { name: '36-59', value: '36-59'},
    { name: '60-Above', value: '60-Above'},
  ];
  public sex = [
    { name: 'Male', value: 'Male'},
    { name: 'Female', value: 'Female'},
  ];
  public apiUrl: string = '';
  public maxFileSize = 10; // 10mb

  constructor(
    private wizardService: FormWizardService,
    private http: HttpClient
  ) {
    const formcontrols = {
      lastName: new FormControl('', [Validators.required]),
      firstName: new FormControl('', [Validators.required]),
      middleName: new FormControl(null, [Validators.required]),
      ageRange: new FormControl(null, [Validators.required]),
    };
    super(2, wizardService.getSteps(), true, formcontrols);
  }

  ngOnInit() {
    this.apiUrl = environment.apiBaseUrl;
    const step1Data = this.wizardService.getStepData(1);
    const date = DateTime.fromJSDate(step1Data.date);
    const formattedDate = date.toFormat('MMMM dd, yyyy');
    const slotTime = step1Data.timeSlot.split('-')[1];

    this.step1Data = {
      location: step1Data.location.split(':')[1],
      date: `${formattedDate} - ${slotTime}`,
      visitor_type: step1Data.visitorType,
      booking_type: step1Data.bookingType,
      student_type: step1Data.studentType,
      municipality: step1Data.municipalities,
      countryOfOrigin: step1Data.countryOfOrigin,
    }

    console.log('XXX', step1Data);
    console.log('step1Data', this.step1Data);
  }
  onUpload(event: any) {
    console.log('File uploaded successfully', event);
  }


  public uploadFiles(files: File[]): Observable<any> {
    console.log('files', files);
    const formData = new FormData();
    //formData.append('files', file, file.name)
    files.forEach(file => formData.append('files', file, file.name));

    // HttpRequest with multipart/form-data
    const headers = new HttpHeaders();
    const uploadReq = new HttpRequest(
      'POST',
      `${this.apiUrl}/upload`,
      formData, 
      {
        headers: headers,
        reportProgress: true,
      }
    );

    return this.http.request(uploadReq);
  }

  public handleFileSelect(event: any) {
    this.isUploading = true;
    const files = event.currentFiles;

    this.uploadFiles(files).subscribe(
      (event: any) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            console.log('upload progress', event.total);
            // if (event.total) {
            //   this.uploadProgress = Math.round((100 * event.loaded) / event.total);
            // }
            break;
          case HttpEventType.Response:
            this.isUploading = false;
            console.log('Upload response', event.body);
            break;
        }
      },
      (err) => {
        console.error('Upload failed:', err);
      }
    );

    //this.isUploading = false;
  }
}
