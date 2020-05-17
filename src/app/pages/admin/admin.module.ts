import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { FivGalleryModule } from '@fivethree/core';

import { AdminPageRoutingModule } from './admin-routing.module';
import { AdminPage } from './admin.page';
import { UploadImagePage } from '../upload-image/upload-image';
import { SupportModule } from '../support/support.module';
import { SupportPage } from '../support/support';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminPageRoutingModule,
    FivGalleryModule,
    SupportModule
  ],
  declarations: [AdminPage, UploadImagePage],
  entryComponents: [
    UploadImagePage,
    SupportPage
  ],
  exports: [UploadImagePage]
})
export class AdminPageModule {}
