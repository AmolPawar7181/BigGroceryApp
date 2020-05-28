
export interface ProductOptions {
    category: string;
    brand: string;
    name: string;
    price: number;
    pricePerQuantity: string;
    img: any;
}

export interface CategoryOptions {
  category: string;
  img: any;
  showOnHome: boolean;
}

export interface BrandOptions {
  brand: string;
  img: any;
  showOnHome: boolean;
}

export interface HomePageData {
  firstCarousel: any;
  secondCarousel: any;
  showCategorys: any;
  showBrands: any;
}