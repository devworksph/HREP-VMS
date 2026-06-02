import { Component, OnInit, Type } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { MuseumFormComponent } from './museum/museum-form.component';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {

  location!: string;
  locationContactNo: string = '';
  locationEmail: string = '';
  xAccount: string = '';
  fbAccount: string = '';
  visitForm!: FormGroup;
  submitted = false;
  currentFormComponent: Type<any> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private cookieService: CookieService
  ) {}

  ngOnInit() {
    this.location = this.route.snapshot.paramMap.get('location')!;
    switch (this.location) {
      case 'Library, Archives and The House':
        this.locationContactNo = '+63(2) 893-15001 local 7101';
        this.locationEmail = 'info.services@house.gov.ph / legislativemuseum@house.gov.ph';
        this.xAccount = 'thehouse.museum';
      break;
      case 'Library and Archives':
        this.locationContactNo = '+63(2) 893-15001 local 7101/7603 - +63(995) 427-0655 - +63(968) 411-1045';
        this.locationEmail = 'info.services@house.gov.ph';
        this.xAccount = 'HRepLAM';
        this.fbAccount = 'HREPLibraryArchivesMuseum';
      break;
      default: // The House Museum
        this.locationContactNo = '+63(02) 886-31023 loc. 7649 / 7650';
        this.locationEmail = 'legislativemuseum@house.gov.ph';
        this.xAccount = 'thehouse.museum';
    }

    const hasConsent = this.cookieService.check(
      `visitor-consent-${this.location}`
    );

    if (!hasConsent) {
      this.router.navigate(['/info', this.location]);
      return;
    }

    this.loadFormComponent();
  }

  loadFormComponent() {
    switch(this.location) {
      case 'The House Museum':
        this.currentFormComponent = MuseumFormComponent;
        break;
      default: this.currentFormComponent = null;
    }
  }
}