import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { MuseumFormComponent } from './museum/museum-form.component';

@NgModule({
  declarations: [
    MuseumFormComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  exports: [
    MuseumFormComponent
  ]
})
export class FormsModule {}