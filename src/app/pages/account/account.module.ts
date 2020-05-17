import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { AccountPage } from './account';
import { AccountPageRoutingModule } from './account-routing.module';
import { FivGalleryModule } from '@fivethree/core';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    AccountPageRoutingModule,
    FivGalleryModule
  ],
  declarations: [
    AccountPage,
  ]
})
export class AccountModule { }
