import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { VisitorService } from '@services/visitor.service';
import { VisitorTypes, StudentTypes, PurposeOfVisit } from '@models/types.model';
import { ILocation, IProvinceData, ContinentsAndCountries, PhPlaces } from '@models/locations.model';
import flatpickr from 'flatpickr';
import { StringHelper } from '@helpers/string.helper';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'museum-form',
  templateUrl: './museum-form.component.html',
  styleUrls: ['./museum-form.component.scss']
})
export class MuseumFormComponent implements OnInit {
  @Input() location: string = '';
  @ViewChild('dateInput') dateInput!: ElementRef;
  
  visitForm!: FormGroup;
  submitted = false;
  maxVisitors = 25;
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
  ageRange = [
    { name: '7-18', value: '7 - 18'},
    { name: '19-35', value: '19 - 35'},
    { name: '36-59', value: '36 - 59'},
    { name: '60-Above', value: '60 - Above'},
  ];

  constructor(
    private fb: FormBuilder,
    private visitorService: VisitorService,
    private stringHelper: StringHelper,
    private http: HttpClient
  ) {}

  ngAfterViewInit() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const disableUntil = new Date();
    disableUntil.setDate(today.getDate() + 4);
    flatpickr(this.dateInput.nativeElement, {
      dateFormat: "l, F j, Y",
      minDate: today,
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
    this.visitForm = this.fb.group({
      preferredSchedule: ['', Validators.required],
      preferredTime: ['', Validators.required],
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
      fileUploaded: ['']
    });

    // Conditional validation
    this.visitForm.get('visitorType')?.valueChanges.subscribe((type) => {
      this.setConditionalValidators(type);
    });

    if (this.location === 'The House Museum and Library & Archives') {
      this.visitForm.get('purposeOfVisit')?.valueChanges.subscribe((type) => {
        this.setPurposeOfVisitValidators(type);
      });
    }
   
    this.validatePurposeOfVisit();
    this.generateTimeSlots();
    this.preparePhPlaces();
    // this.countriesList();

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
    console.log('SS', this.location);
    const match = 
      this.location === 'Library, Archives and The House' || 
      this.location === 'Library and Archives'

    console.log('XXX', match);
    return match;
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
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      sex: ['', Validators.required],
      age: ['', Validators.required],
      email: ['', Validators.required],
      contact: ['', Validators.required],
      soloParent: [false],
      pwd: [false],
      seniorCitizen: [false],
    });
  }

  addVisitor() {
    this.isMaxVisitorReached = false;
    if (this.visitorDetails.length >= this.maxVisitors) {
      this.isMaxVisitorReached = true;
      // alert("Maximum of 25 visitors allowed");
      // return;
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
      otherLgu?.setValidators(Validators.required);
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

    console.log('municipalities', this.municipalities);
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
    if (this.location === 'Library, Archives and The House') {
      control?.setValidators([Validators.required]);    
    } else {
      control?.clearValidators();
    }

    control?.updateValueAndValidity();
  }

  // private countriesList() {
  //   return Countries.map(municipality => ({
  //     ...municipality,
  //     value: municipality.name
  //   }));
  // }

  onFileSelected(
    event: any,
    type: string
  ) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    let endpoint = '/upload-id';
    if (type == 'file') {
      endpoint = '/upload-doc';
    }

    const formData = new FormData();
    formData.append('file', file);
    this.uploadMessage.image = null;
    this.uploadErrors.image = null;
    this.http.post<any>(`${environment.apiBaseUrl}${endpoint}`, formData)
      .subscribe({
        next: (res) => {
          if (res.status) {
            this.uploadMessage[type] = res.file;
            // store uploaded file in form
            this.visitForm.patchValue({ fileUploaded: res.file });
            console.log('Upload success', res);
          } else {
            this.uploadErrors[type] = res.message;
          }
        },
        error: (err) => {
          console.error('Upload error', err);
        }
      });

    this.visitForm.patchValue({ uploadedId: file });
    this.visitForm.get('fileUploaded')?.updateValueAndValidity();
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
    if (this.visitForm.invalid) return;
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
        console.log('response', response);
        if (response.success == true) {
          this.isFormSuccess = true;
          this.isLoading = false;
        }
      },
      error => {
        this.isFormSuccess = false;
        this.isLoading = false;
      }
    );
    console.log('Manila Form Submitted', visitFormData);
  }

  showPicker = false;
formattedDate = '';

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