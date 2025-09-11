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
import { IftaLabelModule } from 'primeng/iftalabel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { StrapiService } from '~core/services/strapi.service';
import { ILocation, IHorSchedules } from '../model/location.model';
import { retry, catchError, of } from 'rxjs';
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
  public locations: ILocation[] | null = [];
  public horSchedules: IHorSchedules[] = [];
  public minDate: Date | null = null;
  public maxDate: Date | null = null;
  public availableSchedules: IHorSchedules[] = [];
  public isLocationsLoaded: boolean = true;

  constructor(
    private wizardService: FormWizardService,
    private strapiService: StrapiService
  ) {
    const formcontrols = {
      location: new FormControl('', [Validators.required]),
      date: new FormControl('', [Validators.required]),
      timeSlot: new FormControl('', [Validators.required]),
      visitorType: new FormControl('', [Validators.required]),
      bookingType: new FormControl('', [Validators.required]),
      studentType: new FormControl(''),
      municipalities: new FormControl(''),
      countryOfOrigin: new FormControl('')
    };
    
    super(1, wizardService.getSteps(), true, formcontrols);
  }

  ngOnInit() {
    const today = DateTime.local();
    this.minDate = today.plus({ days: 5 }).toJSDate();

    this.loadLocations();
    this.getHorSchedules();
    Countries.map(municipality => ({
      ...municipality,
      value: municipality.name
    }));

    
  }

  ngAfterViewInit() {
    const step1Data = this.wizardService.getStepData(1);

    if (step1Data) {
      this.loadLocations();
      this.getHorSchedules();
    }
  }

  public saveStepData() {
    console.log('saveStepDataCalled');
  }

  public onDateSelect(event: any) {
    const selectedDate = DateTime.fromJSDate(event).toFormat('yyyy-MM-dd');
    const filteredDates = this.horSchedules.filter(item => item.date.startsWith(selectedDate));

    this.availableSchedules = filteredDates.map(item => ({
      ...item,
      date: DateTime.fromISO(item.date).toFormat("hh:mm a")
    }));
  }

  private loadLocations() {
    this.isLocationsLoaded = false;
    this.strapiService.getLocations()
      .subscribe(
        (response) => {
          this.isLocationsLoaded = true;
          this.locations = response.data;
        },
        (error) => {
          this.isLocationsLoaded = false;
          this.locations = null;
        });
  }

  private getHorSchedules() {
    this.strapiService.getSchedules().subscribe(
      (response) => {
        this.horSchedules = response.data;
        console.log(this.horSchedules);
      },
      (error) => {
        console.error('Error loading horSchedules', error);
      }
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
}
