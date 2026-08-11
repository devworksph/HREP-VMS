import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { VisitorService } from '@services/visitor.service';
import { getLocationConfig, ILocationConfig, LocationSlug } from '@models/location.config';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements OnInit {

  slug!: LocationSlug;
  location!: ILocationConfig;
  reminders: string = '';
  remindersError: boolean = false;
  consentForm: FormGroup;
  submitted = false;

  privacyNoticeContent: string = '';
  privacyNoticeLoading = false;
  privacyNoticeError = false;
  private privacyNoticeLoaded = false;

  @ViewChild('consentError') consentError?: ElementRef<HTMLElement>;
  @ViewChild('privacyDialog') privacyDialog?: ElementRef<HTMLDialogElement>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private cookieService: CookieService,
    private visitorService: VisitorService
  ) {
    this.consentForm = this.fb.group({
      privacyNotice: [false, Validators.requiredTrue],
      consent: [false, Validators.requiredTrue]
    });
  }

  ngOnInit() {
    const slugParam = this.route.snapshot.paramMap.get('location');
    const config = getLocationConfig(slugParam);

    if (!config) {
      this.router.navigate(['/']);
      return;
    }

    this.slug = config.slug;
    this.location = config;

    this.visitorService.reminders({ location: config.displayName }).subscribe(
      response => {
        // Bound via [innerHTML] below, so Angular's built-in sanitizer
        // strips any unsafe markup before it reaches the DOM.
        this.reminders = response.reminders;
      },
      error => {
        this.remindersError = true;
      }
    );
  }

  proceed() {
    this.submitted = true;

    if (this.consentForm.invalid) {
      // The error banner renders this tick; wait a frame so it exists
      // before we try to scroll it into view.
      setTimeout(() => {
        this.consentError?.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
        this.consentError?.nativeElement.focus({ preventScroll: true });
      });
      return;
    }

    this.cookieService.set(
      `visitor-consent-${this.slug}`,
      'true',
      {
        expires: 1,
        path: '/'
      }
    );

    this.router.navigate(['/form', this.slug]);
  }

  openPrivacyNotice(event: Event) {
    event.preventDefault();

    if (!this.privacyNoticeLoaded && !this.privacyNoticeLoading) {
      this.fetchPrivacyNotice();
    }

    // showModal() traps focus inside the dialog and restores it to this
    // trigger element automatically when the dialog is closed.
    this.privacyDialog?.nativeElement.showModal();
  }

  closePrivacyNotice() {
    this.privacyDialog?.nativeElement.close();
  }

  onPrivacyDialogBackdropClick(event: MouseEvent) {
    if (event.target === this.privacyDialog?.nativeElement) {
      this.closePrivacyNotice();
    }
  }

  retryPrivacyNotice() {
    this.fetchPrivacyNotice();
  }

  private fetchPrivacyNotice() {
    this.privacyNoticeLoading = true;
    this.privacyNoticeError = false;

    this.visitorService.privacyNotice().subscribe(
      response => {
        // Bound via [innerHTML] below, so Angular's built-in sanitizer
        // strips any unsafe markup before it reaches the DOM.
        this.privacyNoticeContent = response.privacy_policy;
        this.privacyNoticeLoaded = true;
        this.privacyNoticeLoading = false;
      },
      error => {
        this.privacyNoticeError = true;
        this.privacyNoticeLoading = false;
      }
    );
  }
}
