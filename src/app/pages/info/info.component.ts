import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CookieService } from 'ngx-cookie-service';
import { VisitorService } from '@services/visitor.service';
import { faXTwitter, faInstagram, faTiktok } from '@fortawesome/free-brands-svg-icons';
import { faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements OnInit {

  location!: string;
  locationContactNo: string = '';
  locationEmail: string = '';
  xAccount: string = '';
  fbAccount: string = '';
  tiktokAccount: string = '';
  reminders!: SafeHtml;
  consentForm: FormGroup;
  submitted = false;
  faXTwitter = faXTwitter;
  faInstagram = faInstagram;
  faEnvelope = faEnvelope;
  faPhone = faPhone;
  faTiktok = faTiktok;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private cookieService: CookieService,
    private visitorService: VisitorService
  ) {
    this.consentForm = this.fb.group({
      privacyNotice: [false, Validators.requiredTrue],
      consent: [false, Validators.requiredTrue]
    });
  }

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

    const params = {
      location: this.location
    };
    this.visitorService.reminders(params).subscribe(
      response => {
        this.reminders = this.sanitizer.bypassSecurityTrustHtml(response.reminders);
      },
      error => {}
    );
  }

  proceed() {
    this.submitted = true;

    if (this.consentForm.invalid) {
      return;
    }

    // set the cookie
    this.cookieService.set(
      `visitor-consent-${this.location}`,
      'true',
      {
        expires: 1,
        path: '/'
      }
    );

    this.router.navigate(['/form', this.location]);
  }
}