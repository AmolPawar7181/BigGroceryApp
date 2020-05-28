import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AboutCompanyPage } from './about-company';
import { AboutCompanyPageRoutingModule } from './about-company-routing.module';
import { IonicModule } from '@ionic/angular';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    AboutCompanyPageRoutingModule
  ],
  declarations: [
    AboutCompanyPage,
  ]
})
export class AboutCompanyModule { }
