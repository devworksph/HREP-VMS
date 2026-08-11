import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LocationSlug } from '@models/location.config';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  constructor(private router: Router) {}

  goToInfo(slug: LocationSlug) {
    this.router.navigate(['/info', slug]);
  }
}