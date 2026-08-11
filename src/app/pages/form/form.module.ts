import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { FormRoutingModule } from './form-routing.module';
import { FormComponent } from './form.component';
import { MuseumFormComponent } from './museum/museum-form.component';

@NgModule({
  declarations: [
    FormComponent,
    MuseumFormComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormRoutingModule
  ]
})
export class FormModule {}
