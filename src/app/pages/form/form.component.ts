import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { getLocationConfig, ILocationConfig } from '@models/location.config';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {

  location!: ILocationConfig;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cookieService: CookieService
  ) {}

  ngOnInit() {
    const slugParam = this.route.snapshot.paramMap.get('location');
    const config = getLocationConfig(slugParam);

    if (!config) {
      this.router.navigate(['/']);
      return;
    }

    this.location = config;

    const hasConsent = this.cookieService.check(
      `visitor-consent-${config.slug}`
    );

    if (!hasConsent) {
      this.router.navigate(['/info', config.slug]);
    }
  }
}
