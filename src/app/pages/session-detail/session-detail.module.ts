import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FivGalleryModule } from '@fivethree/core';

import { SessionDetailPage } from './session-detail';
import { SessionDetailPageRoutingModule } from './session-detail-routing.module';
import { IonicModule } from '@ionic/angular';

import { ProductAdminPage } from '../product-admin/product-admin';
import { AdminPageModule } from '../admin/admin.module';
import { ProductAdminModule} from '../product-admin/product-admin.module';
 
@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    SessionDetailPageRoutingModule,
    FivGalleryModule,
    AdminPageModule,
    ProductAdminModule
  ],
  declarations: [
    SessionDetailPage,
    // ProductAdminPage,
  ],
  entryComponents: [
    ProductAdminPage,
  ],
})
export class SessionDetailModule { }
