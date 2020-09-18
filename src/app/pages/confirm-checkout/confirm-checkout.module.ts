import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { FivGalleryModule } from '@fivethree/core';
import { ConfirmCheckoutPageRoutingModule } from './confirm-checkout-routing.module';

import { ConfirmCheckoutPage } from './confirm-checkout.page';
import { NgxLottieViewModule } from 'ngx-lottie-view';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConfirmCheckoutPageRoutingModule,
    NgxLottieViewModule,
    FivGalleryModule
  ],
  declarations: [ConfirmCheckoutPage]
})
export class ConfirmCheckoutPageModule {}
