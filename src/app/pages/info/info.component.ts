import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements OnInit {

  location!: string;
  consentForm: FormGroup;
  submitted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.consentForm = this.fb.group({
      privacyNotice: [false, Validators.requiredTrue],
      consent: [false, Validators.requiredTrue]
    });
  }

  ngOnInit() {
    this.location = this.route.snapshot.paramMap.get('location')!;
  }

  proceed() {
    this.submitted = true;

    if (this.consentForm.invalid) {
      return;
    }

    this.router.navigate(['/form', this.location]);
  }
}