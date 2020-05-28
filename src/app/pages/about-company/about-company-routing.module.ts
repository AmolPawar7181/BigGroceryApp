import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AboutCompanyPage } from './about-company';

const routes: Routes = [
  {
    path: '',
    component: AboutCompanyPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AboutCompanyPageRoutingModule { }
