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