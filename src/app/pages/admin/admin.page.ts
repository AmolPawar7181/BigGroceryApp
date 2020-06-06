import { Component, OnInit, } from '@angular/core';
import { ModalController, IonRouterOutlet } from '@ionic/angular';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AdminData } from '../../providers/admin-data';
import { ModelService } from '../../providers/models/model-service';
import { UploadImagePage } from '../upload-image/upload-image';
import { ProductOptions, CategoryOptions, BrandOptions, HomePageData } from '../../interfaces/product-options';
import { NgForm } from '@angular/forms';
import { ProductData } from '../../providers/product-data';
import { UserData } from '../../providers/user-data';
import { SupportPage } from '../support/support';

import { CallNumber } from '@ionic-native/call-number/ngx';

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
  catimages = [];
  categoryData: CategoryOptions = {category: '', img: this.catimages, showOnHome: false};
  catSubmitted = false;

  brandimages = [];
  brandData: BrandOptions = {brand: '', img: this.brandimages, showOnHome: false};
  brandSubmitted = false;

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
  addingCategory = false;
  addingBrand = false;
  showClose = false;
  slideOptsOne = {
    initialSlide: 0,
    slidesPerView: 1
  };
  title = 'Orders';

  categories: any;
  brands: any;
  addingHome = false;
  newCategories: { id: string; name: string; isChecked: boolean }[] = [];
  newBrands: { id: string; name: string; isChecked: boolean }[] = [];
  homePageData: HomePageData = { firstCarousel : '', secondCarousel : '', showCategorys : this.newCategories, showBrands: this.newBrands };

  constructor(private adminData: AdminData, private modelService: ModelService,
              private modalCtrl: ModalController, private routerOutlet: IonRouterOutlet,
              private productData: ProductData, private userData: UserData,
              private router: Router, private callNumber: CallNumber) { }

  ngOnInit() {
    if (this.userData.isAdmin) {
      this.getOrdersByStatus('active');
      this.getHomePageData();
     } else {
      this.router.navigateByUrl('/app/tabs/schedule', { replaceUrl: true });
     }
  }

  toggleStatus(event: any) {
    this.status = event ? 'active' : 'delivered';
  }

  ionCheckboxChange(name: any, pos: any, event: any, id: any) {
    this.newCategories[pos].isChecked = event.target.checked;
    const index =  this.homePageData.showCategorys.category.indexOf(id);
    if (index !== -1) {
      this.homePageData.showCategorys.category.splice(index, 1);
    } else {
      if (event.target.checked) {
        this.homePageData.showCategorys.category.push(id);
      }
    }
  }

  ionCheckBrandsChange(name: any, pos: any, event: any, id: any) {
    this.newBrands[pos].isChecked = event.target.checked;
    const index =  this.homePageData.showBrands.brands.indexOf(id);
    if (index !== -1) {
      this.homePageData.showBrands.brands.splice(index, 1);
    } else {
      if (event.target.checked) {
        this.homePageData.showBrands.brands.push(id);
      }
    }
  }

  makeACall(phoneNo: any) {
    this.callNumber.callNumber(phoneNo, true)
    .then(res => console.log('Launched dialer!', res));
  }

  deleteImage(module: any, content: any, pos: any) {
    this.modelService.presentConfirm('Are you sure', 'You want to delete', 'No', 'Yes')
        .then(resp => {
          if (resp === 'ok') {
            this.modelService.presentLoading('Deleting please wait...');
            this.adminData.deleteFromHome(module, content)
                .subscribe((res: any) => {
                  this.modelService.dismissLoading();
                  if (res.success) {
                    this.homePageData.firstCarousel.img.splice(pos, 1);
                    this.modelService.presentToast(res.msg, 2000, 'success');
                  } else {
                    this.modelService.presentToast(res.msg, 2000, 'danger');
                  }
                });
      }
    });
  }

  getOrdersByDate(form: NgForm) {
    this.filterDataSubmitted = true;
    if (form.valid) {
    const [fromdate, fromTime] = this.fromDate.split('T');
    const [todate, toTime] = this.toDate.split('T');
    this.modelService.presentLoading('Please wait...');
    this.adminData.getOrdersByDate(fromdate, todate, this.status)
        .subscribe((orders: any) => {
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

  getHomePageData() {
    this.adminData.getHomePageData()
      .subscribe((homePage: any) => {
        if (homePage.success) {
          this.homePageData.firstCarousel = homePage.homePage[0].content;
          this.homePageData.secondCarousel = homePage.homePage[1].content;
          this.homePageData.showCategorys = homePage.homePage[3].content;
          this.homePageData.showBrands = homePage.homePage[2].content;

          // will check in local storage
          this.productData.getFiltersData()
              .then((filters: any) => {
              // if found
              if (filters.success) {
                this.categories = filters.filterData.categories;
                this.brands = filters.filterData.brands;
                this.generateData(this.categories, this.homePageData.showCategorys, 'category');
                this.generateData(this.brands, this.homePageData.showBrands, 'brand');
              } else {
              // else will get from database
                this.productData.getAllFilters()
                   .subscribe((filtersData: any) => {
                      if (filtersData.success) {
                        this.categories = filtersData.filterData.categories;
                        this.brands = filtersData.filterData.brands;
                        this.generateData(this.categories, this.homePageData.showCategorys, 'category');
                        this.generateData(this.brands, this.homePageData.showBrands, 'brand');
                      }
                   });
              }
            });
        } else {
          this.modelService.presentToast(homePage.msg, 2000, 'danger');
        }
      });
  }


  generateData(content: any, alreadyExists: any, field: any) {
    if (field === 'category') {
      content.forEach((category: any, index: any) => {
        const isChecked = alreadyExists.category.includes(category.id);
        this.newCategories.push({
          id: category.id,
          name: category.category,
          isChecked
        });
      });
    } else if (field === 'brand') {
      content.forEach((brand: any, index: any) => {
        const isChecked = alreadyExists.brands.includes(brand.id);
        this.newBrands.push({
          id: brand.id,
          name: brand.brand,
          isChecked
        });
      });
    }
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

  closeAllAdding() {
    this.addingProduct = false;
    this.addingCategory = false;
    this.addingBrand = false;
    this.showClose = false;
    this.addingHome = false;
  }

  showAdding(mode: any) {
    if (mode === 'product') {
      this.addingProduct = true;
    } else if (mode === 'category') {
      this.addingCategory = true;
    } else if (mode === 'brand') {
      this.addingBrand = true;
    } else if (mode === 'homePage') {
      this.addingHome = true;
    }
    this.showClose = true;
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
      for (let i = 0; i < data.length; i++) {
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
  }


  async presentUploadForHome(module: any) {
    const imgLength = this.homePageData[module].img.length;
    const limit = 3 - imgLength;
    if (imgLength < 3) {
    const modal = await this.modalCtrl.create({
      component: UploadImagePage,
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      componentProps: { limitUpload:  limit},
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      for (let i = 0; i < data.length; i++) {
        this.homePageData[module].img.push(data[i].img_url);
      }
    }
   } else {
     this.modelService.presentToast('Maximum 3 images are allowed', 2000, 'danger');
   }
  }

  addHomePageData(module: any, field: any) {
    const data = {
        module,
        content: this.homePageData[module]
    };

    if (this.homePageData[module][field].length >= 2) {
      this.modelService.presentLoading('Please wait...');
      this.adminData.addHomeData(data)
          .subscribe((res: any) => {
            this.modelService.dismissLoading();
            if (res.success) {
              this.modelService.presentToast(res.msg, 2000, 'success');
            } else {
              this.modelService.presentToast(res.msg, 2000, 'danger');
            }
          });
    } else {
      this.modelService.presentToast(`Atleast 2 ${field}'s required`, 2000, 'danger');
    }
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

  async presentCatUploadPage() {
    const modal = await this.modalCtrl.create({
      component: UploadImagePage,
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      componentProps: { limitUpload: 1 },
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      for (let i = 0; i < data.length; i++) {
        this.catimages.push(data[i].img_url);
      }
    }
  }

  addCategory(form: NgForm) {
    this.catSubmitted = true;
    if (this.catimages.length > 0) {
    if (form.valid) {
        this.modelService.presentLoading('Please wait...');
        this.productData.addCategory(this.categoryData)
            .subscribe((category: any) => {
              this.modelService.dismissLoading();
              if (category.success) {
                this.catimages = [];
                form.resetForm();
                this.catSubmitted = false;
                this.categoryData = {category: '', img: this.catimages, showOnHome: false};
                this.modelService.presentToast(category.msg, 2000, 'success');
              } else {
                this.modelService.presentToast(category.msg, 2000, 'danger');
              }
            });
          }
    } else {
     this.modelService.presentToast('Please select image', 2000, 'danger');
    }
  }

  async presentBrandUploadPage() {
    const modal = await this.modalCtrl.create({
      component: UploadImagePage,
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      componentProps: { limitUpload: 1 },
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      for (let i = 0; i < data.length; i++) {
        this.brandimages.push(data[i].img_url);
      }
    }
  }

  addBrand(form: NgForm) {
    this.brandSubmitted = true;
    if (this.brandimages.length > 0) {
      if (form.valid) {
        this.modelService.presentLoading('Please wait...');
        this.productData.addBrand(this.brandData)
            .subscribe((brand: any) => {
              this.modelService.dismissLoading();
              if (brand.success) {
                this.brandimages = [];
                form.resetForm();
                this.brandSubmitted = false;
                this.brandData = {brand: '', img: this.brandimages, showOnHome: false};
                this.modelService.presentToast(brand.msg, 2000, 'success');
              } else {
                this.modelService.presentToast(brand.msg, 2000, 'danger');
              }
            });
      }
    } else {
      this.modelService.presentToast('Please select image', 2000, 'danger');
    }
  }



}
