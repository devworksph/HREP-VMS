import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { InfoComponent } from './pages/info/info.component';

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
    loadChildren: () => import('./pages/form/form.module').then(m => m.FormModule),
    data: {
      hideHeader: true
    }
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'top'
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}