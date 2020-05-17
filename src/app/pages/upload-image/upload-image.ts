import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  Camera,
  CameraOptions,
  PictureSourceType,
} from '@ionic-native/Camera/ngx';
import {
  ActionSheetController,
  ToastController,
  Platform,
  LoadingController,
  Config,
  ModalController,
  NavParams,
} from '@ionic/angular';
import { File, FileEntry } from '@ionic-native/File/ngx';
import { HttpClient } from '@angular/common/http';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { Storage } from '@ionic/storage';
import { FilePath } from '@ionic-native/file-path/ngx';

import { AdminData } from '../../providers/admin-data';
import { ModelService } from '../../providers/models/model-service';
const STORAGE_KEY = 'my_images';

@Component({
  selector: 'app-upload-image',
  templateUrl: 'upload-image.html',
  styleUrls: ['./upload-image.scss'],
})
export class UploadImagePage {
  images = [];
  imgData = [];
  uploadComplete = 1;
  constructor(
    private camera: Camera,
    private file: File,
    private http: HttpClient,
    private webview: WebView,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController,
    private storage: Storage,
    private plt: Platform,
    private loadingController: LoadingController,
    private ref: ChangeDetectorRef,
    private filePath: FilePath,
    private adminData: AdminData,
    private modelService: ModelService,
    private modalCtrl: ModalController
  ) {}


  loadStoredImages() {
    this.storage.get(STORAGE_KEY).then(images => {
      if (images) {
        const arr = JSON.parse(images);
        this.images = [];
        for (const img of arr) {
          const filePath = this.file.dataDirectory + img;
          const resPath = this.pathForImage(filePath);
          this.images.push({ name: img, path: resPath, filePath });
        }
      }
    });
  }

  pathForImage(img: any) {
    if (img === null) {
      return '';
    } else {
      const converted = this.webview.convertFileSrc(img);
      return converted;
    }
  }

  async selectImage() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Select Image source',
      buttons: [
        {
          text: 'Load from Library',
          handler: () => {
            this.takePicture(this.camera.PictureSourceType.PHOTOLIBRARY);
          },
        },
        {
          text: 'Use Camera',
          handler: () => {
            this.takePicture(this.camera.PictureSourceType.CAMERA);
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  takePicture(sourceType: PictureSourceType) {
    const options: CameraOptions = {
      quality: 100,
      sourceType,
      saveToPhotoAlbum: false,
      correctOrientation: true,
    };

    this.camera.getPicture(options).then((imagePath) => {
      if (sourceType === this.camera.PictureSourceType.PHOTOLIBRARY) {
        this.filePath.resolveNativePath(imagePath).then((filePath) => {
          const correctPath = filePath.substr(0, filePath.lastIndexOf('/') + 1);
          const currentName = imagePath.substring(
            imagePath.lastIndexOf('/') + 1,
            imagePath.lastIndexOf('?')
          );
          this.copyFileToLocalDir(
            correctPath,
            currentName,
            this.createFileName()
          );
        });
      } else {
        const currentName = imagePath.substr(imagePath.lastIndexOf('/') + 1);
        const correctPath = imagePath.substr(0, imagePath.lastIndexOf('/') + 1);
        this.copyFileToLocalDir(
          correctPath,
          currentName,
          this.createFileName()
        );
      }
    });
  }

  createFileName() {
    const d = new Date(),
      n = d.getTime(),
      newFileName = n + '.jpg';
    return newFileName;
  }

  copyFileToLocalDir(namePath: any, currentName: any, newFileName: any) {
    this.file
      .copyFile(namePath, currentName, this.file.dataDirectory, newFileName)
      .then(
        (success) => {
          this.updateStoredImages(newFileName);
        },
        (error) => {
          console.log('Error while storing file.');
          this.modelService.presentToast(
            'Error while storing file.',
            3000,
            'danger'
          );
          // this.presentToast('Error while storing file.');
        }
      );
  }

  updateStoredImages(name: any) {
    this.storage.get(STORAGE_KEY).then((images) => {
      const arr = JSON.parse(images);
      if (!arr) {
        const newImages = [name];
        this.storage.set(STORAGE_KEY, JSON.stringify(newImages));
      } else {
        arr.push(name);
        this.storage.set(STORAGE_KEY, JSON.stringify(arr));
      }

      const filePath = this.file.dataDirectory + name;
      const resPath = this.pathForImage(filePath);

      const newEntry = {
        name,
        path: resPath,
        filePath,
      };

      this.images = [newEntry, ...this.images];
      this.ref.detectChanges(); // trigger change detection cycle
    });
  }

  startUpload(imgEntry: any) {
    this.file
      .resolveLocalFilesystemUrl(imgEntry.filePath)
      .then((entry) => {
        (<FileEntry>entry).file((file) => this.readFile(file));
      })
      .catch((err) => {
        console.log('Error while reading file.');
        this.modelService.presentToast(
          'Error while reading file.',
          3000,
          'danger'
        );
        // this.presentToast('Error while reading file.');
      });
  }

  readFile(file: any) {
    const reader = new FileReader();
    reader.onload = () => {
      const formData = new FormData();
      const imgBlob = new Blob([reader.result], {
        type: file.type,
      });
      formData.append('file', imgBlob, file.name);
      this.uploadImageData(formData);
    };
    reader.readAsArrayBuffer(file);
  }

  async uploadImageData(formData: FormData) {
    // const loading = await this.loadingController.create({
    //     message: 'Uploading image...',
    // }); 
    // await loading.present();
    this.modelService.presentLoading('Uploading image...');
    console.log('formData ', formData);
    this.adminData.addProductImage(formData).subscribe((imagesData: any) => {
      this.modelService.dismissLoading();

      this.imgData.push(imagesData);
      this.uploadComplete = this.uploadComplete + 1;
      this.modelService.presentConfirm('Attention', 'Do you want to add another image?', 'No', 'Yes')
          .then(res => {
              if (res === 'cancel') {
                this.dismiss();
              } else if (res === 'ok') {
                this.selectImage();
              }
            });
    });
  }

  deleteImage(imgEntry: any, position: any) {
    this.images.splice(position, 1);
  }

  dismiss(data?: any) {
    // using the injected ModalController this page
    // can "dismiss" itself and pass back data
    this.modalCtrl.dismiss(this.imgData);
    this.imgData = [];
    this.images = [];
    this.uploadComplete = null;
  }
}
