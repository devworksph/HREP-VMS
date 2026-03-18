import { Component, OnInit, Type } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.location = this.route.snapshot.paramMap.get('location')!;

    this.loadFormComponent();
  }

  loadFormComponent() {
    console.log('locationXXX', this.location);
    
    switch(this.location) {
      case 'The House Museum':
        this.currentFormComponent = MuseumFormComponent;
        break;
      default: this.currentFormComponent = null;
    }
  }
}