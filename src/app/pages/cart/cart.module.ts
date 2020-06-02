import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FivGalleryModule } from '@fivethree/core';

import { CartPageRoutingModule } from './cart-routing.module';
import { CartPage } from './cart.page';
import { SpeakerListModule } from '../speaker-list/speaker-list.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CartPageRoutingModule,
    FivGalleryModule,
    SpeakerListModule
  ],
  declarations: [CartPage]
})
export class CartModule {}
