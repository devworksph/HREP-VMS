import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  trigger,
  style,
  animate,
  transition
} from '@angular/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in',
          style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
})
export class AppComponent {

  visitForm: FormGroup;
  selectedLink: string | null = null;
  submitted = false;
  loading = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.visitForm = this.fb.group({
      fullname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      visitDate: ['', Validators.required]
    });
  }

  showForm(link: string) {
    this.selectedLink = link;
    this.visitForm.reset();
    this.submitted = false;
  }

  closeForm() {
    this.selectedLink = null;
  }

  submit() {
    this.submitted = true;

    if (this.visitForm.invalid) return;

    this.loading = true;

    const payload = {
      location: this.selectedLink,
      ...this.visitForm.value
    };

    this.http.post('http://localhost/ci3-api/visit/store', payload)
      .subscribe({
        next: (res) => {
          alert('Visit request submitted successfully!');
          this.visitForm.reset();
          this.selectedLink = null;
          this.loading = false;
        },
        error: (err) => {
          alert('Submission failed');
          this.loading = false;
        }
      });
  }

  get f() {
    return this.visitForm.controls;
  }
}