import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { BehaviorSubject } from 'rxjs';
import { SmsRetriever } from '@ionic-native/sms-retriever/ngx';

import { UserData } from '../../providers/user-data';
import { UserOptions } from '../../interfaces/user-options';
import { ModelService } from '../../providers/models/model-service';


@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
  styleUrls: ['./login.scss'],
})
export class LoginPage {
  @ViewChild('ngOtpInput', { static: true }) ngOtpInputRef: any;
  login: UserOptions = { username: '', password: '' };
  submitted = false;
  phoneNumber = null;
  otp = null;
  optVerified = false;
  optSent = false;
  verifyOTPSubmitted = false;
  sendOTPSubmitted = false;
  forgotPassSubmitted = false;
  forgotPassword = { newPass: '', confirmPass: ''};
  isForgotPass = false;
  isPassChanged = false;

  time: BehaviorSubject<string> = new BehaviorSubject('00:00');
  timer: number;

  maxAttempt = 3;
  reSendOTP = false;
  interval: any;
  smsHash = '';
  response: any;
  userId: any;

  constructor(
    public userData: UserData,
    public router: Router,
    public storage: Storage,
    private menu: MenuController,
    public modelService: ModelService,
    private smsRetriever: SmsRetriever,
  ) { }

  checkLoginStatus() {
    return this.userData.isLoggedIn().then(loggedIn => {
      this.router.navigateByUrl('/app/tabs/schedule');
    });
  }

  sendOTP(form: NgForm) {
    this.sendOTPSubmitted = true;
    if (form.valid) {
      if (this.mobileValidator(this.phoneNumber)) {
        this.modelService.presentLoading('Validating number...');
        this.userData.checkNumberForgotPass(this.phoneNumber)
            .subscribe((res: any) => {
              this.modelService.dismissLoading();
              if (res.success) {
                this.userId = res.userId[0].userId;
                this.modelService.presentLoading('Sending OTP...');
                // generate hash then send SMS
                this.smsRetriever.getAppHash()
                   .then((hash: any) => {
                      this.smsHash = hash;
                      this.userData.sendOTP(this.phoneNumber, this.smsHash)
                          .subscribe((resOtp: any) => {
                            this.modelService.dismissLoading();
                            if (resOtp.type === 'success') {
                              this.maxAttempt = this.maxAttempt - 1;
                              this.startTimer(1);
                              this.retriveSMS();
                              this.optSent = true;
                              this.modelService.presentToast('OTP sent successfully', 2000, 'success');
                           } else {
                            this.modelService.presentToast(`err: ${resOtp.message}`, 2000, 'danger');
                           }
                          }, (err: any) => {
                            this.modelService.dismissLoading();
                            this.modelService.presentToast(`err: ${err}`, 2000, 'danger');
                          });
                  });
                } else {
                  this.modelService.presentToast(res.msg, 2000, 'danger');
                }
            }, (err: any) => {
              // alert('error checkNumber');
              this.modelService.presentToast(`Error: ${err}`, 2000, 'danger');
            });
      } else {
        form.controls.phone.setErrors({invalid: true});
        this.sendOTPSubmitted = true;
      }
    }
  }

  private mobileValidator(num: number) {
    const numBer = num.toString();
    const n7 =  /^7[0-9].*$/;
    const n8 =  /^8[0-9].*$/;
    const n9 =  /^9[0-9].*$/;
    if (numBer.length === 10 && ( n7.test(numBer) || n8.test(numBer) || n9.test(numBer))) {
      return true;
    } else {
      return false;
    }
  }

  onOtpChange(event: any) {
    this.otp = event;
  }

  async verifyOTP(form: NgForm) {
    this.verifyOTPSubmitted = true;
    if (form.valid) {
      const localOtp = await this.userData.getOTP();
      if (this.otp == localOtp) {
        this.optVerified = true;
        this.userData.removeOTP();
      } else {
        this.modelService.presentToast('OTP did not matched', 2000, 'danger');
      }
    }
  }

  resendOTP() {
    this.reSendOTP = false;
    if (this.maxAttempt > 0) {
        this.modelService.presentLoading('Sending OTP...');
        this.smsRetriever.getAppHash()
            .then((hash: any) => {
              this.smsHash = hash;
              this.userData.sendOTP(this.phoneNumber, this.smsHash)
                  .subscribe((resOtp: any) => {
                    this.modelService.dismissLoading();
                    if (resOtp.type === 'success') {
                      this.maxAttempt = this.maxAttempt - 1;
                      this.startTimer(1);
                      this.retriveSMS();
                      this.optSent = true;
                      this.modelService.presentToast('OTP sent successfully', 2000, 'success');
                    } else {
                      this.modelService.presentToast(`err: ${resOtp.message}`, 2000, 'danger');
                    }
                  });
              })
              .catch((error: any) => {
                console.error(error);
              });
      } else {
        this.modelService.presentToast('You have used all the attempts, please use another number', 2000, 'success');
      }
  }

  startTimer(duration: number) {
    clearInterval(this.interval);
    this.timer = duration * 60;
    this.interval = setInterval( () => {
      this.updateTimeValue();
    }, 1000);
  }

  updateTimeValue() {
    let minutes: any = this.timer / 60;
    let seconds: any = this.timer % 60;

    minutes = String('0' + Math.floor(minutes)).slice(-2);
    seconds = String('0' + Math.floor(seconds)).slice(-2);

    const text = minutes + ':' + seconds;
    this.time.next(text);

    --this.timer;

    if (this.timer < 0) {
      clearInterval(this.interval);
      this.reSendOTP = true;
    }
  }

  retriveSMS() {
    this.smsRetriever.startWatching()
        .then((res: any) => {
          // <#> 1234 is your 4 digit OTP for Grocery app. LDHDHDS
          const otp = res.Message.toString().substr(4, 4);
          this.ngOtpInputRef.setValue(otp);
        });
  }

  changePassword(form: NgForm) {
    this.forgotPassSubmitted = true;
    if (form.valid) {
      if (this.forgotPassword.newPass === this.forgotPassword.confirmPass) {
        this.modelService.presentLoading('Please wait...');
        if (this.userId) {
          const userData = {
            userId: this.userId,
            password: this.forgotPassword.newPass
          };
          this.userData.changePassword(userData)
              .subscribe((res: any) => {
                this.modelService.dismissLoading();
                if (res.success) {
                  this.isPassChanged = true;
                  this.isForgotPass = false;
                  this.modelService.presentToast(res.msg, 2000, 'success');
                } else {
                  this.modelService.presentToast(res.msg, 2000, 'danger');
                }
              });
        }
      } else {
        this.modelService.presentToast('Password does not matched', 2000, 'danger');
      }
    }

  }

  onLogin(form: NgForm) {
    this.submitted = true;

    if (form.valid) {
      this.modelService.presentLoading('Please wait...');
      // console.log(this.login);
      this.userData.login(this.login)
      .subscribe((res: any) => {
        // console.log(res);
        this.modelService.dismissLoading();
        if (res.success) {
            // console.log('login success ', res.userData);
            this.userData.setUserData(res.userData, res.__u_t)
            .then(() => {
              this.router.navigateByUrl('/app/tabs/schedule').then(() => {
                form.resetForm();
                this.submitted = false;
              });
            });
        } else {
          this.modelService.presentToast(res.msg, 2000, 'danger');
          // console.log(res.msg);
        }
    });
    }
  }

  onSignup() {
    this.router.navigateByUrl('/signup');
  }

  ionViewWillEnter() {
    this.storage.get('hasLoggedIn').then(res => {
      if (res === true) {
        this.router.navigateByUrl('/app/tabs/schedule', { replaceUrl: true });
      } else {
        // console.log('ionViewWillEnter else res login', res);
      }
    });

    this.menu.enable(false);
  }

  ionViewWillLeave() {
    // enable the root left menu when leaving the tutorial page
    this.menu.enable(true);
  }
}
