import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpEventType, HttpEvent } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, FormArray } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { VisitorService } from '@services/visitor.service';
import { VisitorTypes, StudentTypes, PurposeOfVisit } from '@models/types.model';
import { IProvinceData, ContinentsAndCountries, PhPlaces } from '@models/locations.model';
import flatpickr from 'flatpickr';
import { StringHelper } from '@helpers/string.helper';
import { environment } from 'src/environments/environment';
import { getLocationConfig, ILocationConfig, LocationSlug } from '@models/location.config';

@Component({
  selector: 'museum-form',
  templateUrl: './museum-form.component.html',
  styleUrls: ['./museum-form.component.scss']
})
export class MuseumFormComponent implements OnInit {
  /** Exact display name expected by the backend's `locationType` field. */
  @Input() location: string = '';
  @Input() slug: LocationSlug = 'museum';
  @Input() locationContactNo: string = '';
  @Input() locationEmail: string = '';
  @ViewChild('dateInput') dateInput!: ElementRef;

  locationConfig!: ILocationConfig;
  visitForm!: FormGroup;
  submitted = false;
  maxVisitors = 24;
  isMaxVisitorReached: boolean = false;
  visitorTypes = VisitorTypes;
  studentTypes = StudentTypes;
  purposeOfVisit = PurposeOfVisit;
  provinces: IProvinceData[] = [];
  municipalities: string[] = [];

  continentsAndCountries = ContinentsAndCountries;
  continents: string[] = [];
  filteredCountries: string[] = [];
  selectedContinent: string = '';

  uploadedFileName: string = '';
  isFormSuccess: boolean = false;
  isLoading: boolean = false;
  submitError: string = '';
  timeSlots: { label: string; value: string }[] = [];
  today: string = '';
  uploadMessage: any = {
    image: '',
    file: ''
  };
  uploadErrors: any = {
    image: '',
    file: ''
  };
  uploadProgress: any = {
    image: 0,
    file: 0
  };
  // Letters (incl. accented/Filipino characters), optionally joined by a
  // single space, hyphen, apostrophe or period — rejects digits and
  // whitespace-only input.
  readonly namePattern = /^[a-zA-ZÀ-ÖØ-öø-ÿ]+(?:[ '\-.][a-zA-ZÀ-ÖØ-öø-ÿ]+)*$/;
  private readonly maxUploadSizeBytes = 5 * 1024 * 1024;
  private readonly allowedUploadTypes: { [key: string]: string[] } = {
    image: ['image/jpeg', 'image/png'],
    file: ['application/pdf']
  };
  ageRange = [
    { name: '7-18', value: '7 - 18'},
    { name: '19-35', value: '19 - 35'},
    { name: '36-59', value: '36 - 59'},
    { name: '60-Above', value: '60 - Above'},
  ];
  showPicker = false;
  formattedDate = '';

  constructor(
    private fb: FormBuilder,
    private visitorService: VisitorService,
    private stringHelper: StringHelper,
    private http: HttpClient,
    private cookieService: CookieService
  ) {}

  ngAfterViewInit() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const disableUntil = new Date();
    disableUntil.setDate(today.getDate() + 4);

    // Preferred Date can't be booked past the end of the current year.
    const maxDate = new Date(today.getFullYear(), 11, 31);

    flatpickr(this.dateInput.nativeElement, {
      dateFormat: "l, F j, Y",
      minDate: today,
      maxDate: maxDate,
      allowInput: false,
      disable: [
        {
          from: today,
          to: disableUntil
        },
        function(date) {
          return (date.getDay() === 0 || date.getDay() === 6);
        }
      ],
      onClose: () => {
        this.visitForm.get('preferredSchedule')?.markAsTouched();
      }
    });
  }
  
  ngOnInit() {
    this.locationConfig = getLocationConfig(this.slug) ?? getLocationConfig('museum')!;

    this.visitForm = this.fb.group({
      preferredSchedule: ['', Validators.required],
      preferredTime: [''],
      visitorType: ['', Validators.required],
      purposeOfVisit: [''],
      purposeOfVisitOther: [''],
      level: [''],
      schoolName: [''],
      province: [''],
      municipality: [''],
      continent: [''],
      countryOfOrigin: [''],
      companyName: [''],
      otherLGU: [''],
      visitorDetails: this.fb.array([this.createVisitor()]),
      fileUploaded: ['', Validators.required]
    });
    const preferredTime = this.visitForm.get('preferredTime');

    if (this.locationConfig.showPreferredTime) {
      preferredTime?.setValidators([Validators.required]);
    } else {
      preferredTime?.clearValidators();
    }

    preferredTime?.updateValueAndValidity();

    // Conditional validation
    this.visitForm.get('visitorType')?.valueChanges.subscribe((type) => {
      this.setConditionalValidators(type);
    });

    if (this.locationConfig.showPurposeOfVisit) {
      this.visitForm.get('purposeOfVisit')?.valueChanges.subscribe((type) => {
        this.setPurposeOfVisitValidators(type);
      });
    }

    this.validatePurposeOfVisit();
    this.generateTimeSlots();
    this.preparePhPlaces();

    const now = new Date();
    this.today = now.toISOString().split('T')[0];

    // get unique continents
    this.continents = [...new Set(this.continentsAndCountries.map(d => d.continent))]
      .sort((a, b) => a.localeCompare(b));

    // React to continent changes
    this.visitForm.get('continent')?.valueChanges.subscribe(continent => {
      this.filteredCountries = this.continentsAndCountries
        .filter(d => d.continent === continent)
        .map(d => d.country);

      // Reset country when continent changes
      this.visitForm.get('country')?.setValue('');
    });
  }

  get visitorDetails(): FormArray {
    return this.visitForm.get('visitorDetails') as FormArray;
  }

  get isShowPurposeOfVisit() {
    return this.locationConfig.showPurposeOfVisit;
  }

  get isStudent() {
    return this.visitForm.get('visitorType')?.value === 'Student';
  }

  get isLGU() {
    return this.visitForm.get('visitorType')?.value === 'Local Government';
  }

  get isOtherLGU() {
    return this.visitForm.get('visitorType')?.value === 'Other LGU';
  }

  get isForeignVisitor() {
    return this.visitForm.get('visitorType')?.value === 'Foreign Visitor';
  }

  get isPrivateSector() {
    return this.visitForm.get('visitorType')?.value === 'Private Sector';
  }

  get f() { return this.visitForm.controls; }

  get paxCount(): number {
    return this.visitorDetails.length;
  }

  createVisitor(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.pattern(this.namePattern)]],
      middleName: ['', Validators.pattern(this.namePattern)],
      lastName: ['', [Validators.required, Validators.pattern(this.namePattern)]],
      sex: ['', Validators.required],
      age: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      contact: ['', [
        Validators.required,
        Validators.pattern(/^09\d{9}$/)
      ]],
      soloParent: [false],
      pwd: [false],
      seniorCitizen: [false],
      indigenousPeople: [false]
    });
  }

  addVisitor() {
    this.isMaxVisitorReached = false;
    if (this.visitorDetails.length >= this.maxVisitors) {
      this.isMaxVisitorReached = true;
    }

    this.visitorDetails.push(this.createVisitor());
  }

  removeVisitor(index: number) {
    this.visitorDetails.removeAt(index);
  }

  generateTimeSlots() {
    const startHour = 9;
    const endHour = 17; // 5 PM

    for (let hour = startHour; hour < endHour; hour++) {
      const start = this.formatTime(hour);
      const end = this.formatTime(hour + 1);

      this.timeSlots.push({
        label: `${start} - ${end}`,
        value: `${start} - ${end}` // backend-friendly value
      });
    }
  }

  formatTime(hour: number): string {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h}:00 ${ampm}`;
  }

  setConditionalValidators(type: string) {
    const level = this.visitForm.get('level');
    const schoolName = this.visitForm.get('schoolName');
    const province = this.visitForm.get('province');
    const municipality = this.visitForm.get('municipality');
    const company = this.visitForm.get('companyName');
    const continent = this.visitForm.get('continent');
    const country = this.visitForm.get('countryOfOrigin');
    const otherLgu = this.visitForm.get('otherLGU');

    // Reset validators first
    [level, schoolName, province, municipality, company, continent, country, otherLgu].forEach((ctrl) => {
      ctrl?.clearValidators();
      ctrl?.updateValueAndValidity();
    });

    if (type === 'Student') {
      level?.setValidators(Validators.required);
      schoolName?.setValidators(Validators.required);
    }
    if (type === 'Local Government') {
      province?.setValidators(Validators.required);
      municipality?.setValidators(Validators.required);
    }
    if (type === 'Private Sector') {
      company?.setValidators(Validators.required);
    }
    if (type === 'Foreign Visitor') {
      continent?.setValidators(Validators.required);
      country?.setValidators(Validators.required);
    }
    if (type === 'Other LGU') {
      otherLgu?.setValidators([Validators.required, notBlankValidator]);
    }

    [level, schoolName, province, municipality, company, country, otherLgu].forEach((ctrl) => {
      ctrl?.updateValueAndValidity();
    });
  }

  setPurposeOfVisitValidators(type: string) {
    const purposeOfVisitOther = this.visitForm.get('purposeOfVisitOther');

    // Reset validators first
    [purposeOfVisitOther].forEach((ctrl) => {
      ctrl?.clearValidators();
      ctrl?.updateValueAndValidity();
    });

    if (type === 'Other') {
      purposeOfVisitOther?.setValidators(Validators.required);
    }
   
    [purposeOfVisitOther].forEach((ctrl) => {
      ctrl?.updateValueAndValidity();
    });
  }

  public onProvinceSelect() {    
    const selectedProvince = this.visitForm.get('province')?.value;
    const selected = this.provinces.find(p => p.province === selectedProvince);
    this.municipalities = selected ? selected.municipalities : [];
    this.visitForm.get('municipality')?.reset();
  }

  private preparePhPlaces() {
    this.provinces = Object.values(PhPlaces)
      .flatMap(region =>
        Object.entries(region.province_list).map(([province, details]) => ({
          province: this.stringHelper.toTitleCase(province),
          municipalities: Object.keys(details.municipality_list)
            .map(this.stringHelper.toTitleCase)
            .sort((a, b) => a.localeCompare(b)),
        }))
      )
      .sort((a, b) => a.province.localeCompare(b.province));
  }

  private validatePurposeOfVisit() {
    const control = this.visitForm.get('purposeOfVisit');
    if (this.locationConfig.purposeOfVisitRequired) {
      control?.setValidators([Validators.required]);
    } else {
      control?.clearValidators();
    }

    control?.updateValueAndValidity();
  }

  onFileSelected(
    event: any,
    type: string
  ) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    this.uploadMessage[type] = '';
    this.uploadErrors[type] = '';
    this.uploadProgress[type] = 0;

    const maxSizeLabel = `${this.maxUploadSizeBytes / (1024 * 1024)}MB`;
    if (file.size > this.maxUploadSizeBytes) {
      this.uploadErrors[type] = `File exceeds the maximum size of ${maxSizeLabel}.`;
      event.target.value = '';
      return;
    }

    if (!this.allowedUploadTypes[type].includes(file.type)) {
      const formats = type === 'file' ? 'PDF' : 'JPG/PNG';
      this.uploadErrors[type] = `Unsupported file type. Accepted formats: ${formats}.`;
      event.target.value = '';
      return;
    }

    let endpoint = '/upload-id';
    if (type == 'file') {
      endpoint = '/upload-doc';
    }

    const formData = new FormData();
    formData.append('file', file);
    this.http.post<any>(`${environment.apiBaseUrl}${endpoint}`, formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress[type] = Math.round((event.loaded / event.total) * 100);
        } else if (event.type === HttpEventType.Response) {
          const res = event.body;
          if (res.status) {
            this.uploadMessage[type] = res.file;
            this.visitForm.patchValue({ fileUploaded: res.file });
          } else {
            this.uploadErrors[type] = res.message;
          }
          this.uploadProgress[type] = 0;
        }
      },
      error: () => {
        this.uploadErrors[type] = 'Upload failed. Please try again.';
        this.uploadProgress[type] = 0;
      }
    });
  }

  getMissingFields(): string[] {
    const missingFields: string[] = [];

    // Tour Schedule fields
    if (this.visitForm.get('preferredSchedule')?.invalid) missingFields.push('Preferred Schedule');
    if (this.visitForm.get('preferredTime')?.invalid) missingFields.push('Preferred Time');

    // Visitor Details fields
    if (this.visitForm.get('visitorType')?.invalid) missingFields.push('Visitor Type');

    if (this.isStudent && this.visitForm.get('level')?.invalid) missingFields.push('Student Level');
    if (this.isLGU) {
      if (this.visitForm.get('province')?.invalid) missingFields.push('Province');
      if (this.visitForm.get('municipality')?.invalid) missingFields.push('Municipality');
    }
    if (this.isPrivateSector && this.visitForm.get('companyName')?.invalid) missingFields.push('Company Name');
    if (this.isForeignVisitor && this.visitForm.get('countryOfOrigin')?.invalid) missingFields.push('Country of Origin');

    // Visitor Information (FormArray)
    this.visitorDetails.controls.forEach((visitor, index) => {
      if (visitor.get('firstName')?.invalid) missingFields.push(`Visitor #${index + 1} First Name`);
      if (visitor.get('lastName')?.invalid) missingFields.push(`Visitor #${index + 1} Last Name`);
      if (visitor.get('sex')?.invalid) missingFields.push(`Visitor #${index + 1} Sex`);
      if (visitor.get('age')?.invalid) missingFields.push(`Visitor #${index + 1} Age`);
      if (visitor.get('email')?.invalid) missingFields.push(`Visitor #${index + 1} Email`);
      if (visitor.get('contact')?.invalid) missingFields.push(`Visitor #${index + 1} Contact`);
    });

    return missingFields;
  }

  submit() {
    this.submitted = true;
    this.submitError = '';
    if (this.visitForm.invalid || this.isLoading) return;
    const locationType = {
      "locationType": this.location
    }
    const visitFormData = {
      ...locationType,
      ...this.visitForm.value
    }

    this.isLoading = true;
    this.visitorService.createVisitor(visitFormData).subscribe(
      response => {
        this.isLoading = false;
        if (response.success == true) {
          this.isFormSuccess = true;

          this.cookieService.delete(
            `visitor-consent-${this.slug}`
          );
        } else {
          this.submitError = response.message || 'We could not submit your booking. Please try again.';
        }
      },
      error => {
        this.isFormSuccess = false;
        this.isLoading = false;
        this.submitError = 'We could not submit your booking. Please check your connection and try again.';
      }
    );
  }

  formatContact(index: number): void {
    const control = this.visitorDetails.at(index).get('contact');

    if (!control) {
      return;
    }

    let digits = control.value?.replace(/\D/g, '') || '';

    if (digits.startsWith('639')) {
      digits = '0' + digits.substring(2);
    }

    if (digits.startsWith('9') && digits.length <= 10) {
      digits = '0' + digits;
    }

    // Limit to 11 digits
    digits = digits.substring(0, 11);

    control.setValue(digits, { emitEvent: false });
  }
  

  openPicker() {
    this.showPicker = true;
  }

  closePicker() {
    setTimeout(() => {
      this.showPicker = false;
    }, 150);
  }

  formatDate(event: any) {
    const value = event.target.value;
    if (!value) return;

    const date = new Date(value);

    this.formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    this.showPicker = false;
  }
}

/** Rejects a value that is present but contains only whitespace. */
function notBlankValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (typeof value === 'string' && value.length > 0 && value.trim().length === 0) {
    return { whitespace: true };
  }
  return null;
}