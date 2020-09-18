import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { IonicModule } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage';
import { Camera } from '@ionic-native/Camera/ngx';
import { File } from '@ionic-native/File/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { CallNumber } from '@ionic-native/call-number/ngx';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { FormsModule } from '@angular/forms';

import { Geolocation } from '@ionic-native/geolocation/ngx';
import { NativeGeocoder } from '@ionic-native/native-geocoder/ngx';
import { NgOtpInputModule } from 'ng-otp-input';
import { WebIntent } from '@ionic-native/web-intent/ngx';
import { SmsRetriever } from '@ionic-native/sms-retriever/ngx';
import { HTTP } from '@ionic-native/http/ngx';
import { TokenInterceptor } from '../app/providers/token.interceptor';
import { ErrorInterceptor } from '../app/providers/error.interceptor';
import { NgxLottieViewModule } from 'ngx-lottie-view';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    IonicModule.forRoot(),
    IonicStorageModule.forRoot(),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production
    }),
    NgOtpInputModule,
    NgxLottieViewModule
  ],
  declarations: [AppComponent],
  providers: [InAppBrowser, SplashScreen, StatusBar,
              Camera, File, WebView, FilePath, CallNumber,
              Geolocation, NativeGeocoder, SmsRetriever,
              HTTP,
              { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true},
              { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true},
              WebIntent

            ],
  bootstrap: [AppComponent]
})
export class AppModule {}
