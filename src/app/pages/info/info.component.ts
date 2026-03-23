import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { VisitorService } from '@services/visitor.service';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements OnInit {

  location!: string;
  reminders!: SafeHtml;
  consentForm: FormGroup;
  submitted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private visitorService: VisitorService
  ) {
    this.consentForm = this.fb.group({
      privacyNotice: [false, Validators.requiredTrue],
      consent: [false, Validators.requiredTrue]
    });
  }

  ngOnInit() {
    this.location = this.route.snapshot.paramMap.get('location')!;

    this.visitorService.reminders().subscribe(
      response => {
        console.log('response', response);
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

    this.router.navigate(['/form', this.location]);
  }
}