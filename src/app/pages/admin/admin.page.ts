import { Component, OnInit, } from '@angular/core';
import { ModalController, IonRouterOutlet } from '@ionic/angular';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AdminData } from '../../providers/admin-data';
import { ModelService } from '../../providers/models/model-service';
import { UploadImagePage } from '../upload-image/upload-image';
import { ProductOptions } from '../../interfaces/product-options';
import { NgForm } from '@angular/forms';
import { ProductData } from '../../providers/product-data';
import { UserData } from '../../providers/user-data';
import { SupportPage } from '../support/support';

const STORAGE_KEY = 'my_images';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPage implements OnInit {
  images = [];
  imgData: any;
  product: ProductOptions = {
    name: '', brand: '', category: '', img: this.images, price: null, pricePerQuantity: ''
  };
  submitted = false;
  addingProduct = false;
  activeOrders: any;
  segment = 'pending';
  customPickerOptions: any;
  toDate: any;
  fromDate: any;
  filterDataSubmitted = false;
  filteredOrders: any = [];
  deliveredOrders: any;
  activeOrdersCount = 0;
  deliveredOrdersCount = 0;
  status: any = 'delivered';

  constructor(private adminData: AdminData, private modelService: ModelService,
              private modalCtrl: ModalController, private routerOutlet: IonRouterOutlet,
              private productData: ProductData, private userData: UserData,
              private router: Router) { }

  ngOnInit() {
    //  console.log('this.userData.isAdmin ', this.userData.isAdmin);
    //  if (this.userData.isAdmin) {
      this.getOrdersByStatus('active');
    //  } else {
    //   this.router.navigateByUrl('/app/tabs/schedule', { replaceUrl: true });
    //  }
  }

  toggleStatus(event: any) {
    this.status = event ? 'active' : 'delivered';
  }

  getOrdersByDate(form: NgForm) {
    this.filterDataSubmitted = true;
    if (form.valid) {
    const [fromdate, fromTime] = this.fromDate.split('T');
    const [todate, toTime] = this.toDate.split('T');
    this.modelService.presentLoading('Please wait...');
    this.adminData.getOrdersByDate(fromdate, todate, this.status)
        .subscribe((orders: any) => {
          console.log('filtered orders ', orders);
          this.modelService.dismissLoading();
          if (orders.success) {
            this.filteredOrders = orders.data;
          } else {
            this.modelService.presentToast(orders.msg, 1000, 'danger');
          }
        });
      }
  }

  getOrdersByStatus(status: any) {
    this.modelService.presentLoading('Please wait...');
    this.adminData.getOrdersByStatus(status)
      .subscribe((orders: any) => {
        this.modelService.dismissLoading();
        if (orders.success) {
          this.activeOrders = orders.data;
          this.activeOrdersCount = orders.data.length;
        } else {
          this.modelService.presentToast(orders.msg, 2000, 'danger');
        }
      });
  }

  setOrderStatus(orderId: any, status: any, pos: any) {
    this.modelService.presentLoading('Please wait...');
    this.adminData.setOrderStatus(status, orderId)
        .subscribe((res: any) => {
          this.modelService.dismissLoading();
          if (res.success) {
            this.activeOrders.splice(pos, 1);
            this.modelService.presentToast(res.msg, 1000, 'success');
          } else {
            this.modelService.presentToast(res.msg, 1000, 'danger');
          }
        });
  }

  async presentUploadPage() {
    const modal = await this.modalCtrl.create({
      component: UploadImagePage,
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      componentProps: { images: this.images },
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      for(let i=0; i< data.length; i++) {
        this.images.push(data[i].img_url);
      }
    }
  }

  async presentMessageUserPage(orderId: any) {
    const modal = await this.modalCtrl.create({
      component: SupportPage,
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      componentProps: { orderId },
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    // if (data) {
    //   for(let i=0; i< data.length; i++) {
    //     this.images.push(data[i].img_url);
    //   }
    // }
  }

  addProduct(form: NgForm) {
    this.submitted = true;
    if (this.images.length > 0) {
      if (form.valid) {
        this.modelService.presentLoading('Please wait...');
        this.productData.addProduct(this.product)
            .subscribe((product: any) => {
              this.modelService.dismissLoading();
              if (product.success) {
                this.images = [];
                form.resetForm();
                this.submitted = false;
                this.product = {name: '', brand: '', category: '', img: this.images, price: null, pricePerQuantity: '' };
                this.modelService.presentToast(product.msg, 2000, 'success');
              } else {
                this.modelService.presentToast(product.msg, 2000, 'danger');
              }
            });
      }
    } else {
      this.modelService.presentToast('Please select image', 2000, 'danger');
    }
  }
}
