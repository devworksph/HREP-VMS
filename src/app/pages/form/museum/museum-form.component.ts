import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { VisitorTypes, StudentTypes } from '@models/types.model';
import { ILocation, IProvinceData, PhPlaces } from '@models/locations.model';
import { Countries } from '@models/countries.model';
import { StringHelper } from '@helpers/string.helper';

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

  constructor(
    private fb: FormBuilder,
    private stringHelper: StringHelper
  ) {}

  ngOnInit() {
    this.visitForm = this.fb.group({
      preferredSchedule: [''],
      preferredDate: [''],
      visitorType: [''],
      level: [''],
      province: [''],
      municipality: [''],
      countryOfOrigin: [''],
      companyName: [''],
      visitors: this.fb.array([this.createVisitor()])
    });

    
    this.preparePhPlaces();
    this.countriesList();
    console.log('provinces', this.countries);

  }

  get visitors(): FormArray {
    return this.visitForm.get('visitors') as FormArray;
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

  get paxCount(): number {
    return this.visitors.length;
  }

  createVisitor(): FormGroup {
      return this.fb.group({
        firstName: [''],
        middleName: [''],
        lastName: [''],
        sex: [''],
        age: [''],
        email: [''],
        contact: ['']
      });
    }

  get f() { return this.visitForm.controls; }

  addVisitor() {

    if (this.visitors.length >= this.maxVisitors) {
      alert("Maximum of 25 visitors allowed");
      return;
    }

    this.visitors.push(this.createVisitor());
  }

  removeVisitor(index: number) {
    this.visitors.removeAt(index);
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

  submit() {
    this.submitted = true;
    if (this.visitForm.invalid) return;
    console.log('Manila Form Submitted', this.visitForm.value);
  }
}