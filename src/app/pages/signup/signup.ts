import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';

import { UserData } from '../../providers/user-data';

import { UserOptions } from '../../interfaces/user-options';
import { ModelService } from '../../providers/models/model-service';


@Component({
  selector: 'page-signup',
  templateUrl: 'signup.html',
  styleUrls: ['./signup.scss'],
})
export class SignupPage {
  phoneNumber = null;
  signup: UserOptions = { username: '', password: '', phone : this.phoneNumber, address : '' };
  otp = null;
  optVerified = false;
  optSent = false;
  signupSubmitted = false;
  sendOTPSubmitted = false;
  verifyOTPSubmitted = false;

  constructor(
    public router: Router,
    public userData: UserData,
    private menu: MenuController,
    public modelService: ModelService
  ) {
  }

  ionViewWillEnter() {
      this.menu.enable(false);
  }

  private mobileValidator(num: number) {
    const numBer = num.toString();
    const n7 =  /^7[0-9].*$/;
    const n8 =  /^8[0-9].*$/;
    const n9 =  /^9[0-9].*$/;
    console.log(numBer);
    console.log(numBer.length);
    if (numBer.length === 10 && ( n7.test(numBer) || n8.test(numBer) || n9.test(numBer))) {
      return true;
    } else {
      return false;
    }
  }

  onSignup(form: NgForm) {
    this.signupSubmitted = true;

    if (form.valid) {
      this.modelService.presentLoading('Please wait...');
      this.userData.signup(this.signup)
          .subscribe((res: any) => {
              this.modelService.dismissLoading();
              console.log(res);
              if (res.success) {
                const msg = 'User created successfully, you will be redirected to login.';
                this.modelService.presentToast(msg, 4000, 'success');
                setTimeout(() => {
                  this.router.navigateByUrl('/login');
                }, 2000);
              } else {
                this.modelService.presentToast(res.message, 2000, 'danger');
                console.log(res.message);
              }
          });

      // this.router.navigateByUrl('/app/tabs/schedule');
    }
  }

  sendOTP(form: NgForm) {
    // this.sendOTPSubmitted = true;

    this.modelService.presentToast('This is a trial version, you can find contact info from About Developers page!!!', '4000', 'danger');

    // if (form.valid) {
    //   if (this.mobileValidator(this.phoneNumber)) {
    //     console.log('sendOTP');
    //     this.userData.sendOTP(this.phoneNumber)
    //         .then(() => {
    //           this.optSent = true;
    //         });
    //   } else {
    //     form.controls.phone.setErrors({invalid: true});
    //     this.sendOTPSubmitted = true;
    //   }
    // }
  }

  async verifyOTP(form: NgForm) {
    this.verifyOTPSubmitted = true;
    if (form.valid) {
      const localOtp = await this.userData.getOTP();
      console.log('localOtp ', localOtp);
      if (this.otp == localOtp) {
        console.log('OPT is correct');
        this.optVerified = true;
        this.userData.removeOTP();
        this.signup.phone = this.phoneNumber;
      } else {
        console.log('OPT is not correct');
      }
    }
  }

}
