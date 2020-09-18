import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConfirmCheckoutPage } from './confirm-checkout.page';

const routes: Routes = [
  {
    path: '',
    component: ConfirmCheckoutPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConfirmCheckoutPageRoutingModule {}
