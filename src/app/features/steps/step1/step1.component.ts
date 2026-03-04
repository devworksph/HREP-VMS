import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DateTime } from 'luxon';
import { FormWizardService } from '~core/components/form-wizard/form-wizard.service';
import { FormWizardStepBaseComponent } from '~core/components/form-wizard/form-wizard-step-base.component';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { StrapiService } from '~core/services/strapi.service';
import { ILocation, IProvinceData, PhPlaces } from '../model/locations.model';
import { ISchedule, IScheduleResponse } from '../model/schedules.model';
import { Observable, finalize, map } from 'rxjs';
import { VisitorTypes, BookingTypes, StudentTypes } from '../model/visitor-details.model';
import { Countries } from '../model/countries.model';
import { TimePeriodFilterPipe } from './time-period-filter.pipe';

@Component({
  selector: 'step1',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RadioButtonModule,
    DatePickerModule,
    InputTextModule,
    SelectModule,
    IftaLabelModule,
    HttpClientModule,
    ProgressSpinnerModule,
    TimePeriodFilterPipe
  ],
  templateUrl: './step1.component.html',
  styleUrl: './step1.component.scss',
})
export class Step1Component extends FormWizardStepBaseComponent implements OnInit {
  public date: Date = new Date();
  public visitorTypes = VisitorTypes;
  public bookingTypes = BookingTypes;
  public studentTypes = StudentTypes;
  public countries = Countries;
  public locations$!: Observable<ILocation[]>;
  public schedules$!: Observable<IScheduleResponse[]>;
  public fixSchedules: any;
  public minDate: Date | null = null;
  public maxDate: Date | null = null;
  public availableSchedules: ISchedule[] = [];
  public isLocationsLoaded = false;
  public isShedulesLoading = false;
  public isShowVisitPurpose = false;
  public isShowFixedSchedule = false;

  selectedPeriod: 'AM' | 'PM' = 'AM';

  provinces: IProvinceData[] = [];
  selectedProvince: string | null = null;
  municipalities: string[] = [];
  selectedMunicipality: string | null = null;

  constructor(
    private wizardService: FormWizardService,
    private strapiService: StrapiService
  ) {
    const formcontrols = {
      location: new FormControl('', [Validators.required]),
      date: new FormControl('', [Validators.required]),
      timeSlot: new FormControl('', [Validators.required]),
      purposeOfVisit: new FormControl(''),
      visitorType: new FormControl('', [Validators.required]),
      bookingType: new FormControl('', [Validators.required]),
      studentType: new FormControl(''),
      companyName: new FormControl(''),
      selectedProvince: new FormControl(),
      selectedMunicipality: new FormControl(''),
      countryOfOrigin: new FormControl('')
    };

    super(1, wizardService.getSteps(), true, formcontrols);
  }

  ngOnInit() {
    const today = DateTime.local();
    this.preparePhPlaces();

    this.minDate = today.plus({ days: 5 }).toJSDate();
    this.locations$ = this.strapiService.getLocations();
    
    this.countriesList();
  }

  ngAfterViewInit() {
    let period: 'AM' | 'PM' = 'PM';

    const step1Data = this.wizardService.getStepData(1);
    
    if (step1Data) {
      const timeSlot = step1Data.timeSlot.split(':');
      const hour = Number(timeSlot[0]);
      const location = step1Data.location.split(':');
      const locationId = location[1];
      const selectedDate = DateTime.fromJSDate(
        step1Data.date
      ).toFormat('yyyy-MM-dd');
    
      period = 'PM';
      if (hour < 12) {
        period = 'AM';
      }

      this.setPeriod(period);
      this.displayTime(
        locationId,
        selectedDate
      );
    }
  }

  get isStudent() {
    return this.form.get('visitorType')?.value === 'Student';
  }

  get isLGU() {
    return this.form.get('visitorType')?.value === 'Local Government';
  }

  get isForeignVisitor() {
    return this.form.get('visitorType')?.value === 'Foreign Visitor';
  }

  public saveStepData() {
    console.log('saveStepDataCalled');
  }

  public onClickLocation(event: any) {
    const selectedLocation = this.form.get('location')?.value;
    const location = selectedLocation.name;
    const date = this.form.get('date')?.value; 

    if (date) {
      const selectedLocationId = selectedLocation.id;
      const selectedDate = DateTime.fromJSDate(date).toFormat('yyyy-MM-dd');
      this.displayTime(
        selectedLocationId, selectedDate
      );
    }

    const locationArr = [''];
    if (locationArr.includes(location)) {
      this.isShowVisitPurpose = false;
      this.form.patchValue({
        purposeOfVisit: ''
      });
    } else {
      this.isShowVisitPurpose = true;
      this.form.patchValue({
        purposeOfVisit: selectedLocation.purpose
      });
    }
  }

  public onDateSelect(event: any) {
    this.isShedulesLoading = true;
    const selectedLocation = this.form.get('location')?.value;
    const locationId = selectedLocation.id;
    const selectedDate = DateTime.fromJSDate(event).toFormat('yyyy-MM-dd');

    // if (locationName == 'All - Legislative Museum, Library, Archives') {
    //   locationId = 5;
    // }

    this.displayTime(
      locationId, selectedDate
    );
  }

  private displayTime(
    selectedLocation: number,
    selectedDate: string
  ) {
    this.schedules$ = this.strapiService.getSchedules({
      location_id: selectedLocation,
      date: selectedDate
    }).pipe(
      finalize(
        () => this.isShedulesLoading = false
      )
    );
  }

  public setPeriod(period: 'AM' | 'PM') {
    this.selectedPeriod = period;
  }

  public countriesList() {
    return Countries.map(municipality => ({
      ...municipality,
      value: municipality.name
    }));
  }

  public onProvinceSelect() {    
    const selectedProvince = this.form.get('selectedProvince')?.value;
    const selected = this.provinces.find(p => p.province === selectedProvince);
    this.municipalities = selected ? selected.municipalities : [];
    this.form.get('selectedMunicipality')?.reset();
  }

  private preparePhPlaces() {
    this.provinces = Object.values(PhPlaces)
      .flatMap(region =>
        Object.entries(region.province_list).map(([province, details]) => ({
          province: this.toTitleCase(province),
          municipalities: Object.keys(details.municipality_list)
            .map(this.toTitleCase)
            .sort((a, b) => a.localeCompare(b)),
        }))
      )
      .sort((a, b) => a.province.localeCompare(b.province));
  }

  private toTitleCase(text: string): string {
    return text
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  }
}
