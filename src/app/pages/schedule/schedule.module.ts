import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FivGalleryModule } from '@fivethree/core';

import { SchedulePage } from './schedule';
import { ScheduleFilterPage } from '../schedule-filter/schedule-filter';
import { SchedulePageRoutingModule } from './schedule-routing.module';
import { ProductAdminPage } from '../product-admin/product-admin';
import { AdminPageModule } from '../admin/admin.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SchedulePageRoutingModule,
    FivGalleryModule,
    AdminPageModule
  ],
  declarations: [
    SchedulePage,
    ScheduleFilterPage,
    ProductAdminPage,
  ],
  entryComponents: [
    ScheduleFilterPage,
    ProductAdminPage,
  ]
})
export class ScheduleModule { }
