import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { MuseumFormComponent } from './museum/museum-form.component';
import { LibraryArchivesFormComponent } from './library-archives/library-archives-form.component';

@NgModule({
  declarations: [
    MuseumFormComponent,
    LibraryArchivesFormComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  exports: [
    MuseumFormComponent,
    LibraryArchivesFormComponent
  ]
})
export class FormsModule {}