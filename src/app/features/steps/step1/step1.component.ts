import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DateTime } from 'luxon';
import { FormWizardService } from '~core/components/form-wizard/form-wizard.service';
import { FormWizardStepBaseComponent } from '~core/components/form-wizard/form-wizard-step-base.component';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DatePickerClasses, DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { StrapiService } from '~core/services/strapi.service';
import { ILocation } from '../model/locations.model';
import { ISchedule, IScheduleResponse } from '../model/schedules.model';
import { Observable, finalize, map } from 'rxjs';
import { VisitorTypes, BookingTypes, StudentTypes } from '../model/visitor-details.model';
import { Municipalities } from '../model/municipality.model';
import { Countries } from '../model/countries.model';

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
    ProgressSpinnerModule
  ],
  templateUrl: './step1.component.html',
  styleUrl: './step1.component.scss',
})
export class Step1Component extends FormWizardStepBaseComponent implements OnInit {
  public date: Date = new Date();
  public visitorTypes = VisitorTypes;
  public bookingTypes = BookingTypes;
  public studentTypes = StudentTypes;
  public municipalities = Municipalities;
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

  times: string[] = [
    '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00'
  ];

  selectedPeriod: 'AM' | 'PM' = 'AM';
  selectedTime: string | null = null;

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
      municipalities: new FormControl(''),
      countryOfOrigin: new FormControl('')
    };

    console.log(formcontrols);
    
    super(1, wizardService.getSteps(), true, formcontrols);
  }

  ngOnInit() {
    const today = DateTime.local();
    
    // this.fixSchedules = {
    //   'schedules': [
    //     {
    //       schedule_id: 1,
    //       time: "08:00"
    //     },
    //     {
    //       schedule_id: 2,
    //       time: "09:00"
    //     },
    //     {
    //       schedule_id: 3,
    //       time: "10:00"
    //     },
    //     {
    //       schedule_id: 4,
    //       time: "11:00"
    //     },
    //     {
    //       schedule_id: 5,
    //       time: "12:00"
    //     },
    //     {
    //       schedule_id: 6,
    //       time: "13:00"
    //     },
    //     {
    //       schedule_id: 7,
    //       time: "14:00"
    //     },
    //     {
    //       schedule_id: 8,
    //       time: "15:00"
    //     },
    //     {
    //       schedule_id: 9,
    //       time: "16:00"
    //     },
    //     {
    //       schedule_id: 10,
    //       time: "17:00"
    //     }
    //   ]
    // }
    this.minDate = today.plus({ days: 5 }).toJSDate();

    this.locations$ = this.strapiService.getLocations();
    this.countriesList();
  }

  ngAfterViewInit() {
    const step1Data = this.wizardService.getStepData(1);

    // if (step1Data) {
    //   this.loadLocations();
    //   this.getHorSchedules();
    // }
  }

  public saveStepData() {
    console.log('saveStepDataCalled');
  }

  public onClickLocation(event: any) {
    const location = event.value.split(':')[0];
    const date = this.form.get('date')?.value;

    console.log('event', location);

    if (date) {
      const selectedLocation = event.value.split(':')[1];
      const selectedDate = DateTime.fromJSDate(date).toFormat('yyyy-MM-dd');;
      this.displayTime(
        selectedLocation, selectedDate
      );
    }

    const locationArr = ['Library', 'Archives'];
    if (locationArr.includes(location)) {
      this.isShowVisitPurpose = true;
      //this.isShowFixedSchedule = true;
    } else {
      this.isShowVisitPurpose = false;
      //this.isShowFixedSchedule = false;
    }
  }

  public onDateSelect(event: any) {
    this.isShedulesLoading = true;
    const locationId = this.form.get('location')?.value;
    const locationName = locationId.split(':')[0];
    let selectedLocation = locationId.split(':')[1];
    const selectedDate = DateTime.fromJSDate(event).toFormat('yyyy-MM-dd');

    if (locationName == 'All - Legislative Museum, Library, Archives') {
      selectedLocation = 5;
    }

    this.displayTime(
      selectedLocation, selectedDate
    );

    // const locationArr = ['Library', 'Archives'];
    // if (!locationArr.includes(locationName)) {
      
    //   this.isShowFixedSchedule = false;
    // } else {
    //   this.isShowFixedSchedule = true;
    // }
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

  get isStudent() {
    return this.form.get('visitorType')?.value === 'Student';
  }

  get isLGU() {
    return this.form.get('visitorType')?.value === 'Local Government';
  }

  get isForeignVisitor() {
    return this.form.get('visitorType')?.value === 'Foreign Visitor';
  }

  get filteredTimes(): string[] {
    return this.selectedPeriod === 'AM'
      ? this.times.filter(t => parseInt(t) < 12)
      : this.times.filter(t => parseInt(t) >= 12);
  }

  setPeriod(period: 'AM' | 'PM') {
    this.selectedPeriod = period;
    this.selectedTime = null; // reset selection
  }

  selectTime(time: string) {
    this.selectedTime = time;
  }

  public countriesList() {
    return Countries.map(municipality => ({
      ...municipality,
      value: municipality.name
    }));
  }
}
