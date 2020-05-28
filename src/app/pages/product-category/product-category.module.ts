import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FivGalleryModule } from '@fivethree/core';

import { ProductCategoryPage } from './product-category';
import { ScheduleFilterPage } from '../schedule-filter/schedule-filter';
import { ProductCategoryPageRoutingModule } from './product-category-routing.module';
import { ProductAdminPage } from '../product-admin/product-admin';
import { AdminPageModule } from '../admin/admin.module';
import { ProductAdminModule } from '../product-admin/product-admin.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProductCategoryPageRoutingModule,
    FivGalleryModule,
    AdminPageModule,
    ProductAdminModule
  ],
  declarations: [
    ProductCategoryPage,
    ScheduleFilterPage,
    // ProductAdminPage,
  ],
  entryComponents: [
    ScheduleFilterPage,
    ProductAdminPage,
  ],
  exports: [
    ProductAdminPage,
   ]
})
export class ProductModule { }
