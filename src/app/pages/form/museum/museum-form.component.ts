import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';

@Component({
  selector: 'museum-form',
  templateUrl: './museum-form.component.html',
  styleUrls: ['./museum-form.component.scss']
})
export class MuseumFormComponent implements OnInit {
  @Input() location: string = '';
  visitForm!: FormGroup;
  submitted = false;
  maxVisitors = 25;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.visitForm = this.fb.group({
      preferredSchedule: [''],
      preferredDate: [''],
      visitorType: ['Student'],
      level: [''],
      visitors: this.fb.array([this.createVisitor()])
    });
  }

  get visitors(): FormArray {
    return this.visitForm.get('visitors') as FormArray;
  }

  createVisitor(): FormGroup {
      return this.fb.group({
        firstName: [''],
        middleName: [''],
        lastName: [''],
        sex: [''],
        age: [''],
        email: [''],
        contact: ['']
      });
    }

  get f() { return this.visitForm.controls; }

  addVisitor() {

    if (this.visitors.length >= this.maxVisitors) {
      alert("Maximum of 25 visitors allowed");
      return;
    }

    this.visitors.push(this.createVisitor());
  }

  removeVisitor(index: number) {
    this.visitors.removeAt(index);
  }

  get paxCount(): number {
    return this.visitors.length;
  }

  submit() {
    this.submitted = true;
    if (this.visitForm.invalid) return;
    console.log('Manila Form Submitted', this.visitForm.value);
  }
}