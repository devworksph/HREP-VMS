import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpEventType, HttpEvent } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, FormArray } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { VisitorService } from '@services/visitor.service';
import { VisitorTypes, StudentTypes, PurposeOfVisit } from '@models/types.model';
import { IProvinceData, ContinentsAndCountries, PhPlaces } from '@models/locations.model';
import flatpickr from 'flatpickr';
import type { Instance as FlatpickrInstance } from 'flatpickr/dist/types/instance';
import { StringHelper } from '@helpers/string.helper';
import { environment } from 'src/environments/environment';
import { UploadResponse } from '@models/api.model';
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
  maxVisitors = 25;
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
  timeSlots: { label: string; value: string; hour: number; disabled: boolean; note: string }[] = [];
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
  private readonly maxUploadSizeBytes = 5 * 1024 * 1024; // keep in sync with api Vms.php max_size (5120 KB)
  private readonly allowedUploadTypes: { [key: string]: string[] } = {
    image: ['image/jpeg', 'image/png'],
    file: ['application/pdf']
  };
  private readonly seniorAgeRange = '60 - Above';
  ageRange = [
    { name: '7-18', value: '7 - 18'},
    { name: '19-35', value: '19 - 35'},
    { name: '36-59', value: '36 - 59'},
    { name: '60-Above', value: '60 - Above'},
  ];
  showPicker = false;
  formattedDate = '';
  // True when the chosen date has no seat left in any slot: the whole time dropdown is disabled.
  timeSlotsFull = false;
  private picker?: FlatpickrInstance;
  private disabledDateRules: any[] = [];
  private closedDates = new Map<string, { kind: 'holiday' | 'unavailable' | 'full'; label: string }>();

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

    this.disabledDateRules = [
      {
        from: today,
        to: disableUntil
      },
      function(date: Date) {
        return (date.getDay() === 0 || date.getDay() === 6);
      }
    ];

    this.picker = flatpickr(this.dateInput.nativeElement, {
      dateFormat: "l, F j, Y",
      minDate: today,
      maxDate: maxDate,
      allowInput: false,
      disable: this.disabledDateRules,
      onChange: dates => this.onDateChosen(dates[0]),
      onReady: (_dates, _str, fp) => {
        fp.calendarContainer.classList.add('no-weekends');
      },
      onDayCreate: (_dates, _str, _fp, dayElem) => {
        const weekday = dayElem.dateObj.getDay();
        if (weekday === 0 || weekday === 6) {
          dayElem.classList.add('weekend-day');
        }

        const closed = this.closedDates.get(this.toIsoDate(dayElem.dateObj));
        if (closed) {
          dayElem.title = closed.label;
          dayElem.classList.add(closed.kind === 'holiday' ? 'holiday' : `day-${closed.kind}`);
        }
      },
      onClose: () => {
        this.visitForm.get('preferredSchedule')?.markAsTouched();
      }
    });

    this.loadHolidays();
    if (this.locationConfig.scheduleMode !== 'none') {
      this.loadAvailability();
    }
  }

  private toIsoDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  // Holidays and availability arrive after the picker exists. The API still
  // rejects these dates server-side, so a failed load only costs the marking.
  private loadHolidays() {
    this.visitorService.holidays().subscribe({
      next: response => {
        (response.holidays ?? []).forEach(h =>
          this.closedDates.set(h.date, { kind: 'holiday', label: `Holiday: ${h.name}` }));
        this.applyClosedDates();
      },
      error: () => {}
    });
  }

  private loadAvailability() {
    this.visitorService.availability(this.slug).subscribe({
      next: response => {
        if (!response.enforced) {
          return;
        }
        // A holiday keeps its own marking if a date is both.
        (response.unavailable ?? []).forEach(date => {
          if (!this.closedDates.has(date)) {
            this.closedDates.set(date, { kind: 'unavailable', label: 'Unavailable: no schedule for this date' });
          }
        });
        (response.full ?? []).forEach(date => {
          if (!this.closedDates.has(date)) {
            this.closedDates.set(date, { kind: 'full', label: 'Full: no slots left on this date' });
          }
        });
        this.applyClosedDates();
      },
      error: () => {}
    });
  }

  // Slots with no seats left on the chosen date are disabled in the time
  // dropdown. Capacity is per slot per date, so this reloads on every date change.
  private onDateChosen(date?: Date) {
    this.timeSlotsFull = false;
    if (!date || !this.locationConfig.showPreferredTime || this.locationConfig.scheduleMode !== 'capacity') {
      return;
    }

    this.visitorService.slots(this.slug, this.toIsoDate(date)).subscribe({
      next: response => {
        if (!response.enforced) {
          this.timeSlots.forEach(slot => { slot.disabled = false; slot.note = ''; });
          return;
        }

        const remainingByHour = new Map(response.slots.map(s => [s.hour, s.remaining]));
        this.timeSlots.forEach(slot => {
          const remaining = remainingByHour.get(slot.hour);
          slot.disabled = !remaining || remaining <= 0;
          slot.note = remaining === undefined ? 'Not available' : (remaining <= 0 ? 'Full' : '');
        });

        const chosen = this.timeSlots.find(slot => slot.value === this.visitForm.get('preferredTime')?.value);
        if (chosen?.disabled) {
          this.visitForm.get('preferredTime')?.setValue('');
        }

        // Someone took the last seats after the calendar loaded: mark the date
        // full there too (this clears the pick), then lock the time dropdown.
        if (this.timeSlots.length && this.timeSlots.every(slot => slot.disabled)) {
          const iso = this.toIsoDate(date);
          if (!this.closedDates.has(iso)) {
            this.closedDates.set(iso, { kind: 'full', label: 'Full: no slots left on this date' });
          }
          this.applyClosedDates();
          this.visitForm.get('preferredTime')?.setValue('');
          this.timeSlotsFull = true;
        }
      },
      error: () => {}
    });
  }

  private applyClosedDates() {
    // Date objects, not strings: flatpickr would parse "YYYY-MM-DD" strings
    // with the picker's own "l, F j, Y" format and silently not match.
    const closed = Array.from(this.closedDates.keys()).map(iso => {
      const [year, month, day] = iso.split('-').map(Number);
      return new Date(year, month - 1, day);
    });

    this.picker?.set('disable', [...this.disabledDateRules, ...closed]);
    this.picker?.redraw();

    const chosen = this.picker?.selectedDates[0];
    if (chosen && this.closedDates.has(this.toIsoDate(chosen))) {
      this.picker?.clear();
      this.visitForm.get('preferredSchedule')?.setValue('');
    }
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
      otherVisitorType: [''],
      visitorDetails: this.fb.array([this.createVisitor()], { validators: duplicateVisitorsValidator }),
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

  get isOtherVisitorType() {
    return this.visitForm.get('visitorType')?.value === 'Others';
  }

  get f() { return this.visitForm.controls; }

  get isMaxVisitorReached(): boolean {
    return this.visitorDetails.length >= this.maxVisitors;
  }

  get paxCount(): number {
    return this.visitorDetails.length;
  }

  createVisitor(): FormGroup {
    const visitor = this.fb.group({
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

    const age = visitor.get('age')!;
    const senior = visitor.get('seniorCitizen')!;
    const isSeniorAge = () => age.value === this.seniorAgeRange;

    age.valueChanges.subscribe(() => {
      senior.setValue(isSeniorAge(), { emitEvent: false });
    });
    // Senior status is derived from the age range, so it can't be unticked.
    senior.valueChanges.subscribe(checked => {
      if (isSeniorAge() && !checked) {
        senior.setValue(true, { emitEvent: false });
      }
    });

    return visitor;
  }

  addVisitor() {
    if (this.isMaxVisitorReached) {
      return;
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
        value: `${start} - ${end}`, // backend-friendly value
        hour,
        disabled: false,
        note: ''
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
    const otherVisitorType = this.visitForm.get('otherVisitorType');

    // Reset validators first
    [level, schoolName, province, municipality, company, continent, country, otherLgu, otherVisitorType].forEach((ctrl) => {
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
    if (type === 'Others') {
      otherVisitorType?.setValidators([Validators.required, notBlankValidator]);
    }

    [level, schoolName, province, municipality, company, country, otherLgu, otherVisitorType].forEach((ctrl) => {
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
    this.http.post<UploadResponse>(`${environment.apiBaseUrl}${endpoint}`, formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event: HttpEvent<UploadResponse>) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress[type] = Math.round((event.loaded / event.total) * 100);
        } else if (event.type === HttpEventType.Response) {
          const res = event.body!;
          if (res.status) {
            this.uploadMessage[type] = res.file ?? '';
            // Only the ID image ('image') maps to the form's `fileUploaded`
            // control — the backend reads that field exclusively as the
            // government-ID scan path. The benchmarking letter ('file')
            // has no corresponding backend field, so it must not overwrite it.
            if (type === 'image') {
              this.visitForm.patchValue({ fileUploaded: res.file ?? '' });
            }
          } else {
            this.uploadErrors[type] = res.message ?? 'Upload failed. Please try again.';
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
    if (this.isOtherVisitorType && this.visitForm.get('otherVisitorType')?.invalid) missingFields.push('Visitor Type (Others)');

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
      "locationType": this.location,
      "locationSlug": this.slug
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
        this.submitError = this.extractSubmitErrorMessage(error);
      }
    );
  }

  /**
   * A non-2xx response (e.g. server-side form_validation failures, which
   * return {status:false, errors:{...}}) is routed to the error callback,
   * not the success one — so it must be unpacked here or its detail is lost.
   */
  private extractSubmitErrorMessage(error: any): string {
    const body = error?.error;

    if (body && body.errors && typeof body.errors === 'object') {
      const messages = Object.values(body.errors).filter(Boolean) as string[];
      if (messages.length) {
        return messages.join(' ');
      }
    }

    if (body && typeof body.message === 'string' && body.message) {
      return body.message;
    }

    return 'We could not submit your booking. Please check your connection and try again.';
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

/** Flags visitors sharing the same name and the same email or contact number. */
function duplicateVisitorsValidator(control: AbstractControl): ValidationErrors | null {
  const people = (control.value as any[]).map(v => ({
    name: `${v.firstName ?? ''}|${v.middleName ?? ''}|${v.lastName ?? ''}`.trim().toLowerCase(),
    email: (v.email ?? '').trim().toLowerCase(),
    contact: (v.contact ?? '').replace(/\D/g, '')
  }));
  const duplicates: number[] = [];

  people.forEach((p, i) => {
    if (!p.name.replace(/\|/g, '')) return;
    const dupOfEarlier = people.slice(0, i).some(o =>
      o.name === p.name && ((p.email && o.email === p.email) || (p.contact && o.contact === p.contact)));
    if (dupOfEarlier) duplicates.push(i + 1);
  });

  return duplicates.length ? { duplicateVisitors: duplicates } : null;
}

/** Rejects a value that is present but contains only whitespace. */
function notBlankValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (typeof value === 'string' && value.length > 0 && value.trim().length === 0) {
    return { whitespace: true };
  }
  return null;
}