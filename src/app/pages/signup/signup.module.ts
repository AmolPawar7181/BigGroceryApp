import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NgOtpInputModule } from 'ng-otp-input';

import { SignupPage } from './signup';
import { SignupPageRoutingModule } from './signup-routing.module';
import { PolicyPage } from '../policy/policy';
import { PolicyModule } from '../policy/policy.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SignupPageRoutingModule,
    NgOtpInputModule,
    PolicyModule
  ],
  declarations: [
    SignupPage
  ],
  entryComponents: [
    PolicyPage
  ],
  exports: [PolicyPage]
})
export class SignUpModule { }
