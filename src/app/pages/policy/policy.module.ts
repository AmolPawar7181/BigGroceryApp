import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { PolicyPage } from './policy';
import { PolicyPageRoutingModule } from './policy-routing.module';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    PolicyPageRoutingModule
  ],
  declarations: [PolicyPage],
  entryComponents: [PolicyPage],
  exports: [
    PolicyPage,
   ]
})
export class PolicyModule {}
