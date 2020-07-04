import { Component } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { NgForm } from '@angular/forms';

import { ProductData } from '../../providers/product-data';
import { ModelService } from '../../providers/models/model-service';
import { ProductOptions } from '../../interfaces/product-options';
import { UploadImagePage } from '../upload-image/upload-image';

@Component({
  selector: 'page-product-admin',
  templateUrl: 'product-admin.html',
  styleUrls: ['./product-admin.scss'],
})
export class ProductAdminPage {
  images = [];
  imgData: any;
  product: ProductOptions = {
    name: '',
    brand: '',
    category: '',
    img: [],
    price: null,
    pricePerQuantity: '',
    description: '',
    mrp: null
  };
  submitted = false;
  categories: any;
  brands: any;

  constructor(
    public modalCtrl_: ModalController,
    public navParams: NavParams,
    public productData: ProductData,
    public modelService: ModelService
  ) {}

  ionViewWillEnter() {
    this.product = {
      name: '',
      brand: '',
      category: '',
      img: [],
      price: null,
      pricePerQuantity: '',
      description: '',
      mrp: null
    };
    // passed in array of track names that should be excluded (unchecked)
    const productDetails = this.navParams.get('productDetails');
    this.product = productDetails;
    // will check in local storage
    this.productData.getFiltersData().then((filters: any) => {
      if (filters) {
        // if found
        if (filters.success) {
          this.categories = filters.filterData.categories;
          this.brands = filters.filterData.brands;
        } else {
          // else will get from database
          this.modelService.presentLoading('Please wait...');
          this.productData.getAllFilters().subscribe((filtersData: any) => {
            this.modelService.dismissLoading();
            if (filtersData.success) {
              this.categories = filtersData.filterData.categories;
              this.brands = filtersData.filterData.brands;
              this.productData.setFiltersData(filtersData);
            }
          });
        }
      } else {
        // else will get from database
        this.modelService.presentLoading('Please wait...');
        this.productData.getAllFilters().subscribe((filtersData: any) => {
          this.modelService.dismissLoading();
          if (filtersData.success) {
            this.categories = filtersData.filterData.categories;
            this.brands = filtersData.filterData.brands;
            this.productData.setFiltersData(filtersData);
          }
        });
      }
    });
  }

  async presentUploadPage() {
    const modal = await this.modalCtrl_.create({
      component: UploadImagePage,
      swipeToClose: true,
      componentProps: { images: this.images },
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      for (let i = 0; i < data.length; i++) {
        this.product.img.push(data[i].img_url);
      }
    }
  }

  updateProduct(form: NgForm) {
    this.submitted = true;
    if (this.product.img.length > 0) {
      if (form.valid) {
        this.modelService.presentLoading('Please wait...');
        this.productData
          .updateProduct(this.product)
          .subscribe((product: any) => {
            this.modelService.dismissLoading();
            if (product.success) {
              this.modelService.presentToast(product.msg, 2000, 'success');
              this.dismiss(product.data);
            } else {
              this.modelService.presentToast(product.msg, 2000, 'danger');
            }
          });
      }
    } else {
      this.modelService.presentToast('Please select image', 2000, 'danger');
    }
  }

  dismiss(data?: any) {
    // using the injected ModalController this page
    // can "dismiss" itself and pass back data
    this.modalCtrl_.dismiss(data);
  }
}
