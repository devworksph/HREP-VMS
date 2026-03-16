import { Component, OnInit, Input } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { VisitorService } from '@services/visitor.service';
import { VisitorTypes, StudentTypes } from '@models/types.model';
import { ILocation, IProvinceData, PhPlaces } from '@models/locations.model';
import { Countries } from '@models/countries.model';
import { StringHelper } from '@helpers/string.helper';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'museum-form',
  templateUrl: './museum-form.component.html',
  styleUrls: ['./museum-form.component.scss']
})
export class MuseumFormComponent implements OnInit {
  @Input() location: string = '';

  visitForm!: FormGroup;
  submitted = false;
  maxVisitors = 25;
  visitorTypes = VisitorTypes;
  studentTypes = StudentTypes;
  provinces: IProvinceData[] = [];
  municipalities: string[] = [];
  countries = Countries;
  uploadedFileName: string = '';
  uploadMessage: string = '';
  isFormSuccess: boolean = false;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private visitorService: VisitorService,
    private stringHelper: StringHelper,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.visitForm = this.fb.group({
      preferredSchedule: ['', Validators.required],
      preferredTime: ['', Validators.required],
      visitorType: ['', Validators.required],
      level: [''],
      province: [''],
      municipality: [''],
      countryOfOrigin: [''],
      companyName: [''],
      visitorDetails: this.fb.array([this.createVisitor()]),
      governmentId: ['']
    });

    // Conditional validation
    this.visitForm.get('visitorType')?.valueChanges.subscribe((type) => {
      this.setConditionalValidators(type);
    });

    this.preparePhPlaces();
    this.countriesList();
  }

  get visitorDetails(): FormArray {
    return this.visitForm.get('visitorDetails') as FormArray;
  }

  get isStudent() {
    return this.visitForm.get('visitorType')?.value === 'Student';
  }

  get isLGU() {
    return this.visitForm.get('visitorType')?.value === 'Local Government';
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
    if (this.visitorDetails.length >= this.maxVisitors) {
      alert("Maximum of 25 visitors allowed");
      return;
    }

    this.visitorDetails.push(this.createVisitor());
  }

  removeVisitor(index: number) {
    this.visitorDetails.removeAt(index);
  }

  setConditionalValidators(type: string) {
    const level = this.visitForm.get('level');
    const province = this.visitForm.get('province');
    const municipality = this.visitForm.get('municipality');
    const company = this.visitForm.get('companyName');
    const country = this.visitForm.get('countryOfOrigin');

    // Reset validators first
    [level, province, municipality, company, country].forEach((ctrl) => {
      ctrl?.clearValidators();
      ctrl?.updateValueAndValidity();
    });

    if (type === 'Student') {
      level?.setValidators(Validators.required);
    }
    if (type === 'Local Government') {
      province?.setValidators(Validators.required);
      municipality?.setValidators(Validators.required);
    }
    if (type === 'Private Sector') {
      company?.setValidators(Validators.required);
    }
    if (type === 'Foreign Visitor') {
      country?.setValidators(Validators.required);
    }

    [level, province, municipality, company, country].forEach((ctrl) => {
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

  private countriesList() {
    return Countries.map(municipality => ({
      ...municipality,
      value: municipality.name
    }));
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    this.http.post<any>(`${environment.apiBaseUrl}/upload-id`, formData)
      .subscribe({
        next: (res) => {
          if (res.status) {
            this.uploadedFileName = res.file;
            // store uploaded file in form
            this.visitForm.patchValue({ governmentId: res.file });
            console.log('Upload success', res);
          } else {
            //alert('Upload failed: ' + res.message);
            this.uploadMessage = res.message;
          }
        },
        error: (err) => {
          console.error('Upload error', err);
        }
      });

    this.visitForm.patchValue({ uploadedId: file });
    this.visitForm.get('governmentId')?.updateValueAndValidity();
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
      "locationType": "Museum"
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
}