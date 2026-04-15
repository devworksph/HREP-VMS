import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { InfoComponent } from './pages/info/info.component';
import { FormComponent } from './pages/form/form.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'info/:location',
    component: InfoComponent,
    data: {
      hideHeader: true
    }
  },
  {
    path: 'form/:location',
    component: FormComponent,
    data: {
      hideHeader: true
    }
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}