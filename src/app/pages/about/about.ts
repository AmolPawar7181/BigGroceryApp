import { Component } from '@angular/core';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { AdminData } from '../../providers/admin-data';


@Component({
  selector: 'page-about',
  templateUrl: 'about.html',
  styleUrls: ['./about.scss'],
})
export class AboutPage {

  storeData: any = { storeName: '', address: '', contactNo: ''};

  constructor(public adminData: AdminData, private callNumber: CallNumber) { }


  ionViewWillEnter() {
    this.adminData.getStoreData()
        .subscribe((res: any) => {
          console.log('res ', res);
          this.storeData = res;
        });
  }
  makeACall() {
    this.callNumber.callNumber(this.storeData.contactNo, true)
    .then(res => console.log('Launched dialer!', res));
  }
}
