import { Component } from '@angular/core';
import { Config, ModalController, NavParams } from '@ionic/angular';

import { ConferenceData } from '../../providers/conference-data';
import { ProductData } from '../../providers/product-data';
import { ModelService } from '../../providers/models/model-service';

@Component({
  selector: 'page-schedule-filter',
  templateUrl: 'schedule-filter.html',
  styleUrls: ['./schedule-filter.scss'],
})
export class ScheduleFilterPage {
  ios: boolean;

  tracks: { name: string; icon: string; isChecked: boolean }[] = [];
  categories: { name: string; isChecked: boolean }[] = [];
  brands: { name: string; isChecked: boolean }[] = [];

  constructor(
    public confData: ConferenceData,
    private config: Config,
    public modalCtrl: ModalController,
    public navParams: NavParams,
    public productData: ProductData,
    public modelService: ModelService
  ) {}

  ionViewWillEnter() {
    this.ios = this.config.get('mode') === `ios`;

    // passed in array of track names that should be excluded (unchecked)
    const excludeProducts = this.navParams.get('excludeProducts');
    console.log('products ', excludeProducts);
    // this.productData.getFiltersData().then((value) => {
    //   console.log('value ', value);
    //   if (value) {
    //     this.setFilterData(value, excludeProducts);
    //   } else {
    console.log('value not present');
    this.modelService.presentLoading('Loading...');
    this.productData.getAllFilters().subscribe((data: any) => {
          this.modelService.dismissLoading();
          if (data.success) {
            this.productData.setFiltersData(data.filterData);
            this.setFilterData(data.filterData, excludeProducts);
          }
        });
      // }
    // });

    // this.confData.getTracks().subscribe((tracks: any[]) => {
    //   tracks.forEach(track => {
    //     this.tracks.push({
    //       name: track.name,
    //       icon: track.icon,
    //       isChecked: (excludedTrackNames.indexOf(track.name) === -1)
    //     });
    //   });
    // });
  }

setFilterData(data: any, excludeProducts: any) {

    data.categories.forEach((category: any, index: any) => {
      const isChecked = excludeProducts[0].filterCategorys ? excludeProducts[0].filterCategorys.includes(category.category) : false;
      this.categories.push({
        name: category.category,
        isChecked
      });
    });

    data.brands.forEach((brand: any, index: any) => {
      const isChecked = excludeProducts[1].filterbrands ? excludeProducts[1].filterbrands.includes(brand.brand) : false;
      this.brands.push({
        name: brand.brand,
        isChecked
      });
    });
  }

selectAll(check: boolean) {
    // set all to checked or unchecked
    this.categories.forEach((track) => {
      track.isChecked = check;
    });

    this.brands.forEach((track) => {
      track.isChecked = check;
    });
  }

applyFilters() {
    // Pass back a new array of track names to exclude
    const filterCategorys = this.categories
      .filter((c) => c.isChecked)
      .map((c) => c.name);
    const filterbrands = this.brands
      .filter((c) => c.isChecked)
      .map((c) => c.name);
    const excludedFilterNames = { filterCategorys, filterbrands };

    console.log('excludedFilterNames ', excludedFilterNames);
    this.dismiss(excludedFilterNames);
  }

dismiss(data?: any) {
    // using the injected ModalController this page
    // can "dismiss" itself and pass back data
    this.modalCtrl.dismiss(data);
  }
}
