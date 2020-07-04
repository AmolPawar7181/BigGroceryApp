const functions = require("firebase-functions");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const Busboy = require("busboy");
admin.initializeApp();

const express = require("express");
// const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");
const https = require('https');
//const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
//const crypto = require('crypto');
// const moment = require('moment');
//const SALT_I = 10;
const cors = require("cors")({ origin: true });

const app = express();
const tmpdir = os.tmpdir();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors);

const firebaseConfig = {
  apiKey: "AIzaSyAG563WT-O4vzKekW8DOUwra1S3AgJVxsE",
  authDomain: "grocery-app-c43f5.firebaseapp.com",
  databaseURL: "https://grocery-app-c43f5.firebaseio.com",
  projectId: "grocery-app-c43f5",
  storageBucket: "grocery-app-c43f5.appspot.com",
  messagingSenderId: "747961489403",
  appId: "1:747961489403:web:c860e88e326e62b5ea1d5e",
};

const firebase = require("firebase");
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();
const bucket = admin.storage().bucket();

////////////////////////
///// Middlewares
///////////////////////

// const { auth } = require("./middleware/auth");
// const { admin_ } = require("./middleware/admin");

////////////////////////
///// Models
///////////////////////
//const { User } = require("./models/user");
const SECRET = "SUPERSECRETPASSWORD123";
let lastObject = "";


let auth = (req, res, next) => {
  let token = req.header('__u_t');
  jwt.verify(token, SECRET, (err, decode)=> {
    if(err) {
      res.json({ success: false, msg: "Authentication failed, Please login" });
        return;
    }
    
    db.collection("userTable")
    .where("username", "==", decode)
    .where("token", "==", token)
    .get()
    .then((snapshot) => {
      // if username not found
      if (snapshot.empty) {
        res.json({ success: false, msg: "Authentication failed, Please login" });
        return;
      }
      let user = {}
      snapshot.forEach(doc => {
          user = doc.data()
          user.userId = doc.id
      });

      req.token = token;
      req.user = user;
      next();
    })
  })
}

let admin_check = (req, res, next) => {
  let token = req.header('__u_t');
  jwt.verify(token, SECRET, (err, decode)=> {
    if(err) {
      res.json({ success: false, msg: "You're not allowed to perform this action" });
        return;
    }
    
    db.collection("userTable")
    .where("username", "==", decode)
    .where("token", "==", token)
    .where("role", "==", 1)
    .get()
    .then((snapshot) => {
      // if username not found
      if (snapshot.empty) {
        res.json({ success: false, msg: "You're not allowed to perform this action" });
        return;
      }
      let user = {}
      snapshot.forEach(doc => {
          user = doc.data()
          user.userId = doc.id
      });

      req.token = token;
      req.user = user;
      next();
    })
  })
}

////////////////////////
///// UPI DATA
///////////////////////


app.get("/getPayMethodData", (req, res) => {

  const rezData = {
    "currency": "INR",
    "key": "rzp_test_qSDMaDCnqrsw9T",
    "name": "Shree Ambeshwar Enterprises",
    "description": "Pay for grocery items"
  }

  const upiData = { 
      "payeeVPA": "amol-pawar@icici", 
      "payeeName": "Amol%20Pawar",
      "amount": 0,
      "tranId": "",
      "currency": "INR",
      "tranNote": "Payment%20for%20Groceries",
      "trRef": ""
    }
  
  res.json({success: true, upiData, cod: true, deChrg: 40, minTotal: 500});
})

app.post("/addUpiData", (req, res) => {
  const upiData = req.body;
  db.collection("upiTable")
    .add({upiData,
      createdAt: admin.firestore.Timestamp.fromDate(new Date())
    })
    .then(() => {
      res.json({success: true, msg: `Data added successfully`});
    })
    .catch((err) => {
      res
        .status(500)
        .json({ success: false, error: "Something went wrong", err: err });
    });
});

////////////////////////
///// HOME PAGE
///////////////////////

// this will return data for home page 
app.get("/getHomePageData", (req, res) => {
  db.collection("homeTable")
    .get()
    .then((data) => {
      let homePage = [];
      data.forEach((doc) => {
        homePage.push({ homePageId: doc.id, content: doc.data() });
      });
      return homePage;
      // will return all the data in the table 
    })
    .then((homePage) => {
      const category = [];
      // will fetch categories from category table by id
      for (let i = 0; i < homePage[3].content.category.length; i++) {
        category.push(
          db.doc(`/categoryTable/${homePage[3].content.category[i]}`)
            .get()
            .then((doc) => {
               const homePageData = {
                homePage,
                data: doc.data()
               }
                return homePageData;
            })
        )
      }
      return Promise.all(category);
    })
    .then((homePageData) => {
      const homePage = [];
      homePage.push(homePageData[0].homePage[0]);
      homePage.push(homePageData[0].homePage[1]);

      const categories = {homePageId: "showCategorys", content: []};

      for (let i = 0; i < homePageData.length; i++) {
        categories.content.push(homePageData[i].data);
      }
      homePage.push(categories);

      const brands = [];
      // will fetch brands from brand table by id
      for (let i = 0; i < homePageData[0].homePage[2].content.brands.length; i++) {
        brands.push(
          db.doc(`/brandTable/${homePageData[0].homePage[2].content.brands[i]}`)
            .get()
            .then((doc) => {
               const homePageNewData = {
                homePage,
                data: doc.data()
               }
               
                return homePageNewData;
            })
        )
      }

      return Promise.all(brands);
    })
    .then((finalData)=>{
      // organize data correctly 
      const homePage = [];
      homePage.push(finalData[0].homePage[0]);
      homePage.push(finalData[0].homePage[1]);
      homePage.push(finalData[0].homePage[2]);

      const brands = {homePageId: "showBrands", content: []};

      for (let i = 0; i < finalData.length; i++) {
        brands.content.push(finalData[i].data);
      }
      homePage.push(brands);

      res.json({success: true, homePage});
    })
    .catch((err) => {
      res
        .status(500)
        .json({ success: false, error: "Something went wrong", err: err });
    });
});

// this will return data for admin page 
app.get("/getHomePage", (req, res) => {
  db.collection("homeTable")
    .get()
    .then((data) => {
      let homePage = [];
      data.forEach((doc) => {
        homePage.push({ homePageId: doc.id, content: doc.data() });
      });
      
      return res.json({success: true, homePage});
    })
    .catch((err) => {
      res
        .status(500)
        .json({ success: false, error: "Something went wrong", err: err });
    });
});

app.post("/addHomeData", admin_check, (req, res) => {
  const module = req.body.module;
  const content = req.body.content;
  db.collection("homeTable")
    .doc(module)
    .update(content)
    .then(() => {
      res.json({success: true, msg: `${module} Updated successfully`});
    })
    .catch((err) => {
      res
        .status(500)
        .json({ success: false, error: "Something went wrong", err: err });
    });
});

app.put("/deleteFromHome", admin_check, (req, res) => {
  const module = req.query.module;
  const content = req.query.content;
  let deleteFrom = ''
  if (module === 'showCategorys') {
    db.collection("homeTable")
      .doc(module)
      .update({
        category: admin.firestore.FieldValue.arrayRemove(content)
      })
      .then(() => {
        res.json({success: true, msg: 'Deleted successfully'});
      })
      .catch((err) => {
        res
          .status(500)
          .json({ success: false, error: "Something went wrong", err: err });
      });
  } else {
    db.collection("homeTable")
        .doc(module)
        .update({
          img: admin.firestore.FieldValue.arrayRemove(content)
        })
        .then(() => {
          const link = content.split('/o/').pop();
          const file = link.substr(0, link.indexOf('?'));
          bucket.file(file).delete();
          res.json({success: true, msg: 'Deleted successfully'});
        })
        .catch((err) => {
          res
            .status(500)
            .json({ success: false, error: "Something went wrong", err: err });
        });
  }
    
})


////////////////////////
///// ORDER
///////////////////////

app.post("/addOrder",auth, (req, res) => {
  const newOrder = {
    userId: req.body.userId,
    total: req.body.total,
    products: req.body.products,
    paymentId: req.body.paymentId,
    paymentMethod: req.body.paymentMethod,
    productAmount: req.body.productAmount,
    deChrg: req.body.deChrg,
    status: "active",
    createdAt: admin.firestore.Timestamp.fromDate(new Date()),
  };
  db.collection("orderTable")
    .add(newOrder)
    .then((doc) => {
      const orderId = doc.id;
      res.json({
        success: true,
        orderId,
        msg: `Order placed successfully. Check notifications under My Account for order update`,
      });
      return orderId;
    })
    .then((orderId) => {
      // add history
      // const history = [];
      // for (let i = 0; i < newOrder.products.length; i++) {
      // history.push(
      db.doc(`/userTable/${newOrder.userId}`)
        .collection("history")
        .doc()
        .create({ orderId: orderId,
                  createdAt: admin.firestore.Timestamp.fromDate(new Date()) })
        .then(() => {
          return true;
        });
      // )
      // }
      // remove items from cart
      const cartDetails = [];
      console.log("newOrder.products.length ", newOrder.products.length);
      for (let i = 0; i < newOrder.products.length; i++) {
        cartDetails.push(
          db
            .doc(
              `/userTable/${newOrder.userId}/cart/${newOrder.products[i].productId}`
            )
            .delete()
            .then((doc) => {
              return true;
            })
        );
      }
      return Promise.all(cartDetails);
    })
    .catch((err) => {
      res
        .status(500)
        .json({ success: false, error: "Something went wrong", err: err });
    });
});

app.get("/getActiveOrders", admin_check, (req, res) => {
  db.collection("orderTable")
    .where("status", "==", "active")
    .get()
    .then((data) => {
      let orders = [];
      data.forEach((doc) => {
        orders.push({ orderId: doc.id, order: doc.data() });
      });
      return orders;
    })
    .then((orders) => {
      let orderData = orders;
      const ordersDetail = [];
      for (let i = 0; i < orders.length; i++) {
        ordersDetail.push(
          db
            .doc(`/userTable/${orders[i].order.userId}`)
            .get()
            .then((doc) => {
              let userData = {
                orders: orders[i],
                userData: {
                  username: doc.data().username,
                  phone: doc.data().phone,
                  address: doc.data().address,
                },
              };
              return userData;
            })
        );
      }
      return Promise.all(ordersDetail);
    })
    .then((activeOrders) => {
      res.json({ success: true, data: activeOrders });
    })
    .catch((err) => {
      res
        .status(500)
        .json({ success: false, error: "Something went wrong", err: err });
    });
});

app.get("/getOrdersByStatus",admin_check, (req, res) => {
  const status = req.query.status;
  db.collection("orderTable")
    .where("status", "==", status)
    .get()
    .then((data) => {
      let orders = [];
      data.forEach((doc) => {
        orders.push({ orderId: doc.id, order: doc.data() });
      });
      return orders;
    })
    .then((orders) => {
      let orderData = orders;
      const ordersDetail = [];
      for (let i = 0; i < orders.length; i++) {
        ordersDetail.push(
          db
            .doc(`/userTable/${orders[i].order.userId}`)
            .get()
            .then((doc) => {
              let userData = {
                orders: orders[i],
                userData: {
                  username: doc.data().username,
                  phone: doc.data().phone,
                  address: doc.data().address,
                },
              };
              return userData;
            })
        );
      }
      return Promise.all(ordersDetail);
    })
    .then((activeOrders) => {
      res.json({ success: true, data: activeOrders });
    })
    .catch((err) => {
      res
        .status(500)
        .json({ success: false, error: "Something went wrong", err: err });
    });
});

app.put("/setOrderStatus",admin_check, (req, res) => {
  const status = req.query.status;
  const orderId = req.query.orderId;

  db.collection("orderTable")
    .doc(orderId)
    .set(
      { status, deliveredAt: admin.firestore.Timestamp.fromDate(new Date()) },
      { merge: true }
    )
    .then(() => {
      return res.json({ success: true, msg: "Status updated successfully" });
    })
    .catch((err) => {
      res
        .status(500)
        .json({ success: false, error: "Something went wrong", err: err });
    });
});

app.put("/setOrderMsg", admin_check, (req, res) => {
  const message = req.body.msg;
  const orderId = req.body.orderId;

  db.collection("orderTable")
    .doc(orderId)
    .set(
      { message, messagedAt: admin.firestore.Timestamp.fromDate(new Date()) },
      { merge: true }
    )
    .then(() => {
      return res.json({ success: true, msg: "Message added successfully" });
    })
    .catch((err) => {
      res
        .status(500)
        .json({ success: false, error: "Something went wrong", err: err });
    });
});

app.get("/getOrders",admin_check, (req, res) => {
  db.collection("orderTable")
    .get()
    .then((data) => {
      let orders = [];
      data.forEach((doc) => {
        orders.push(doc.data());
      });
      return res.json(orders);
    })
    .catch((err) => {
      res
        .status(500)
        .json({ success: false, error: "Something went wrong", err: err });
    });
});

app.get("/getOrderById", (req, res) => {
  let orderId = req.query.id;
  db.doc(`/orderTable/${orderId}`)
    .get()
    .then((data) => {
      return res.send(data.data());
    })
    .catch((err) => {
      console.error(err);
      return res.json({ error: "somethig went wrong" });
    });
});

app.get("/getOrdersByDate", admin_check,(req, res) => {
  const status = req.query.status;
  const fromDate = new Date(req.query.fromDate);
  const toDate = new Date(req.query.toDate);

  console.log("fromDate ", fromDate);
  console.log("toDate ", toDate);

  db.collection("/orderTable")
    .where("createdAt", ">=", fromDate)
    .where("createdAt", "<=", toDate)
    .where("status", "==", status)
    .get()
    .then((data) => {
      let orders = [];
      data.forEach((doc) => {
        orders.push({ orderId: doc.id, order: doc.data() });
      });
      return orders;
    })
    .then((orders) => {
      let orderData = orders;
      const ordersDetail = [];
      for (let i = 0; i < orders.length; i++) {
        ordersDetail.push(
          db
            .doc(`/userTable/${orders[i].order.userId}`)
            .get()
            .then((doc) => {
              let userData = {
                orders: orders[i],
                userData: {
                  username: doc.data().username,
                  phone: doc.data().phone,
                  address: doc.data().address,
                },
              };
              return userData;
            })
        );
      }
      return Promise.all(ordersDetail);
    })
    .then((activeOrders) => {
      if (activeOrders.length > 0) {
        return res.json({ success: true, data: activeOrders });
      } else {
        return res.json({ success: false, msg: "No orders found!!!" });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.json({ success: false, msg: err });
    });

  // .then((data) => {
  //   let orders = [];
  //   data.forEach((doc) => {
  //     orders.push(doc.data());
  //   });
  //   if(orders.length > 0) {
  //     return res.json({success: true, data: orders});
  //   } else {
  //     return res.json({success: false, msg:"No orders found!!!"});
  //   }

  // })
});

////////////////////////
///// USER
///////////////////////

app.get("/removeSaveForLater", auth, (req, res) => {
  let saveId = req.query.saveId;
  let userId = req.query.userId;

  db.collection(`userTable/${userId}/saved`)
    .doc(saveId)
    .delete()
    .then((snapshot) => {
      res.json({ success: true, msg: "Removed from saved list" });    
  })
  .catch((err) => {
    res
      .status(500)
      .json({ success: false, error: "Something went wrong", err: err });
  });
});

app.get("/addSaveForLater", auth, (req, res) => {
  let productId = req.query.productId;
  let userId = req.query.userId;
  const product = {
    product: productId,
    createdAt: admin.firestore.Timestamp.fromDate(new Date()),
  }

  db.collection(`userTable/${userId}/saved`)
    .where("product", "==", productId)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        db.doc(`/userTable/${userId}`)
          .collection("saved")
          .add(product)
          .then(() => {
            res.json({status: true, msg: 'Saved for later'})
          });
          return
      }

      res.json({ success: false, msg: "Already in saved list" });
    
  })
  .catch((err) => {
    res
      .status(500)
      .json({ success: false, error: "Something went wrong", err: err });
  });
})

app.get("/getSaveForLater", auth, (req, res) => {

  let userId = req.query.userId;

  db.doc(`/userTable/${userId}`)
    .collection("saved")
    .get()
    .then((querySnapshot) => {
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({ productId: doc.id, data: doc.data() });
      });

      res.json({status: true, products});
    })
    .catch((err) => {
      res
        .status(500)
        .json({ success: false, error: "Something went wrong", err: err });
    });
})



app.get("/getProductImageById", (req, res) => {
  let productId = req.query.id;
  bucket
    .getFiles()
    .then((files) => {
      const img_url = "";
      files[0].forEach((file, index) => {
        let img_id = file.id;
        img_id = img_id.substr(0, img_id.indexOf("."));
        if (img_id == productId) {
          img_url = `https://firebasestorage.googleapis.com/v0/b/${file.metadata.bucket}/o/${file.id}?alt=media`;
          return;
        }
      });

      return res.send(img_url);
    })
    .catch((err) => {
      console.error(err);
      return res.json({ error: "somethig went wrong getting image" });
    });
});

app.get("/removeProductImage", (req, res) => {
  let productId = req.query.id;
  bucket
    .file(productId)
    .delete()
    .then((data) => {
      return res.send(JSON.stringify(data[0]));
    })
    .catch((err) => {
      console.error(err);
      return res.json({ error: "somethig went wrong reemoving image" });
    });
});

app.post("/addProductImage",auth, (req, res) => {
  const busboy = new Busboy({ headers: req.headers });
  const uploads = {};
  const fileWrites = [];

  busboy.on("file", (fieldname, file, filename) => {
    const filepath = path.join(tmpdir, filename);
    uploads[fieldname] = filepath;
    const writeStream = fs.createWriteStream(filepath);
    file.pipe(writeStream);
    // File was processed by Busboy; wait for it to be written to disk.
    const promise = new Promise((resolve, reject) => {
      file.on("end", () => {
        writeStream.end();
      });
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });
    fileWrites.push(promise);
  });

  busboy.on("finish", async () => {
    await Promise.all(fileWrites);
    const file_to_upload = uploads.file;
    const options = {
      resumable: false,
    };
    bucket
      .upload(file_to_upload, options)
      .then((file) => {
        const img_url = `https://firebasestorage.googleapis.com/v0/b/${file[0].metadata.bucket}/o/${file[0].id}?alt=media`;
        //res.send(img_url);
        return res.json({ img_name: file[0].id, img_url: img_url });
      })
      .catch((err) => {
        console.error(err);
        return res.json({ error: "somethig went wrong adding images" });
      });
  });
  busboy.end(req.rawBody);
});

app.get("/getProductImage", (req, res) => {
  bucket
    .getFiles()
    .then((files) => {
      const imagesData = files[0].map(function (file) {
        const img_url = `https://firebasestorage.googleapis.com/v0/b/${file.metadata.bucket}/o/${file.id}?alt=media`;
        return img_url;
      });

      return res.send(imagesData);
    })
    .catch((err) => {
      console.error(err);
      return res.json({ error: "somethig went wrong getting images" });
    });
});

app.post("/successBuy",auth, (req, res) => {
  let history = [];
  let transactionData = {};
  const userId = req.body.user._id;

  req.body.cartDetail.forEach((item) => {
    history.push({
      dateOfPurchase: Date.now(),
      name: item.name,
      id: item.id,
      price: item.price,
      quantity: item.quantity,
      paymentId: req.body.paymentData.paymentID,
    });
  });

  transactionData.user = {
    id: req.body.user._id,
    username: req.body.user.username,
    phone: req.body.user.phone,
  };

  transactionData.data = req.body.paymentData;
  transactionData.product = history;

  db.doc(`/userTable/${userId}`)
    .collection("history")
    .add(transactionData)
    .then((doc) => {
      db.doc(`/userTable/${userId}`)
        .collection("history")
        .get()
        .then((querySnapshot) => {
          let collections = [];
          querySnapshot.forEach((doc) => {
            collections.push({ id: doc.id, data: doc.data() });
          });
          res.send(collections);
        });
    });
});

app.get("/getPurchaseHistory",auth, (req, res) => {
  const userId = req.query.userId;
  db.doc(`/userTable/${userId}`)
    .collection("history")
    .orderBy("createdAt", "desc")
    .get()
    .then((querySnapshot) => {
      let collections = [];
      querySnapshot.forEach((doc) => {
        collections.push(doc.data());
      });
      return collections;
    })
    .then((historyData) => {
      if (historyData.length > 0) {
        // res.json({ success: true, data: collections });

        const historyDetails = [];
        for (let i = 0; i < historyData.length; i++) {
          historyDetails.push(
            db
              .doc(`/orderTable/${historyData[i].orderId}`)
              .get()
              .then((doc) => {
                if (doc.exists) {
                  return doc.data();
                } else {
                  return;
                }
              })
          );
        }
        return Promise.all(historyDetails);
      } else {
        res.json({ success: false, msg: "Nothing in history" });
      }
    })
    .then((data) => {
      res.json({ success: true, data });
    })
    .catch((err) => {
      console.error(err);
      return res.json({ success: false, msg: err });
    });
});

app.post("/removefromCart",auth, (req, res) => {
  const userId = req.query.userId;
  const productID = req.query.productId;
  const pCount = req.query.count;
  // remove if only 1 item is there
  // else recrease the count by 1
  if (pCount == 1) {
    db.doc(`/userTable/${userId}`)
      .collection("cart")
      .doc(productID)
      .delete()
      .then(() => {
        db.doc(`/userTable/${userId}`)
          .collection("cart")
          .get()
          .then((querySnapshot) => {
            const results = [];
            querySnapshot.forEach((doc) => {
              results.push({ count: doc.data().count, productId: doc.id });
              return false;
            });
            return results;
          })
          .then((products) => {
            const cartDetails = [];
            console.log("products ", products.length);
            for (let i = 0; i < products.length; i++) {
              cartDetails.push(
                db
                  .doc(`/productTable/${products[i].productId}`)
                  .get()
                  .then((data) => {
                    let cart = {
                      count: products[i].count,
                      productId: products[i].productId,
                      details: data.data(),
                    };
                    return cart;
                  })
              );
            }
            return Promise.all(cartDetails);
          })
          .then((data) => {
            if (data.length > 0) {
              // res.send(data);
              res.json({
                success: true,
                msg: "Item deleted successfully",
                data: data,
              });
            } else {
              res.json({ success: false, msg: "Cart is empty" });
            }
          })
          .catch((err) => {
            console.error(err);
            return res.json({ catchError: err });
          });
      })
      .catch((err) => {
        console.error(err);
        return res.json({ catchError: "Error removing document: ", err });
      });
  } else {
    db.doc(`/userTable/${userId}`)
      .collection("cart")
      .doc(productID)
      .get()
      .then((doc) => {
        let count = doc.data().count - 1;
        db.doc(`/userTable/${userId}`)
          .collection("cart")
          .doc(productID)
          .set({
            count: count,
            createdAt: admin.firestore.Timestamp.fromDate(new Date()),
          })
          .then(() => {
            db.doc(`/userTable/${userId}`)
              .collection("cart")
              .get()
              .then((querySnapshot) => {
                const results = [];
                querySnapshot.forEach((doc) => {
                  results.push({ count: doc.data().count, productId: doc.id });
                  return false;
                });
                return results;
              })
              .then((products) => {
                const cartDetails = [];
                console.log("products ", products.length);
                for (let i = 0; i < products.length; i++) {
                  cartDetails.push(
                    db
                      .doc(`/productTable/${products[i].productId}`)
                      .get()
                      .then((data) => {
                        let cart = {
                          count: products[i].count,
                          productId: products[i].productId,
                          details: data.data(),
                        };
                        return cart;
                      })
                  );
                }
                return Promise.all(cartDetails);
              })
              .then((data) => {
                if (data.length > 0) {
                  // res.send(data);
                  res.json({
                    success: true,
                    msg: "Item deleted successfully",
                    data: data,
                  });
                } else {
                  res.json({ success: false, msg: "Cart is empty" });
                }
              })
              .catch((err) => {
                console.error(err);
                return res.json({ success: false, msg: err });
              });
          })
          .catch((err) => {
            console.error(err);
            return res.json({
              success: false,
              msg: "Error removing document ",
            });
          });
      })
      .catch((err) => {
        console.error(err);
        return res.json({ success: false, msg: "Error removing document " });
      });
  }
});

app.get("/getSavedForLater", auth, (req, res)=> {
  const userId = req.query.userId;
  db.doc(`/userTable/${userId}`)
    .collection("saved")
    .get()
    .then((querySnapshot) => {
       if(querySnapshot.empty) {
        return res.json({success: false, data: [] })
       }

      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({saveId: doc.id, productId: doc.data().product });
      });
      return products;
    })
    .then((products) => {
       var productDetails = [];
       for (let i = 0; i < products.length; i++) {
        productDetails.push(
          db
            .doc(`/productTable/${products[i].productId}`)
            .get()
            .then((data) => {
              let product = {
                saveId: products[i].saveId,
                productId: products[i].productId,
                details: data.data()
              };
              return product;
            })
        );
      }
      return Promise.all(productDetails);
    })
    .then((data) => {
      if (data.length > 0) {
        // res.send(data);
        res.json({
          success: true,
          data: data,
        });
      } else {
        res.json({ success: false, data: [] });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.json({ catchError: err });
    });
})

app.post("/getCartDetails", auth, (req, res) => {
  const userId = req.query.userId;
  let cartDetails = [];
  db.doc(`/userTable/${userId}`)
    .collection("cart")
    .get()
    .then((querySnapshot) => {
      const results = [];
      querySnapshot.forEach((doc) => {
        results.push({ count: doc.data().count, productId: doc.id });
        return false;
      });
      return results;
    })
    .then((products) => {
      const cartDetails = [];
      console.log("products ", products.length);
      for (let i = 0; i < products.length; i++) {
        cartDetails.push(
          db
            .doc(`/productTable/${products[i].productId}`)
            .get()
            .then((data) => {
              let cart = {
                count: products[i].count,
                productId: products[i].productId,
                details: data.data(),
              };
              return cart;
            })
        );
      }
      return Promise.all(cartDetails);
    })
    .then((data) => {
      if (data.length > 0) {
        // res.send(data);
        res.json({
          success: true,
          data: data,
        });
      } else {
        res.json({ success: false, msg: "Cart is empty" });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.json({ catchError: err });
    });
});

app.post("/addToCart", auth, (req, res) => {
  const userId = req.query.userId;
  const productID = req.query.productId;
  let duplicate = false;
  db.doc(`/userTable/${userId}`)
    .collection("cart")
    .get()
    .then((querySnapshot) => {
      let duplicate = false;
      let count = 0;
      querySnapshot.forEach((doc) => {
        if (doc.id == productID) {
          duplicate = true;
          count = doc.data().count;
        }
      });

      if (duplicate) {
        db.doc(`/userTable/${userId}`)
          .collection("cart")
          .doc(productID)
          .set({
            count: count + 1,
            createdAt: admin.firestore.Timestamp.fromDate(new Date()),
          })
          .then((doc) => {
            db.doc(`/userTable/${userId}`)
              .collection("cart")
              .get()
              .then((querySnapshot) => {
                let collections = [];
                querySnapshot.forEach((doc) => {
                  collections.push({ id: doc.id, data: doc.data() });
                });
                res.send(collections);
              });
          });
      } else {
        let newItem = {
          count: 1,
          createdAt: admin.firestore.Timestamp.fromDate(new Date()),
        };
        db.doc(`/userTable/${userId}`)
          .collection("cart")
          .doc(productID)
          .create(newItem)
          .then((doc) => {
            db.doc(`/userTable/${userId}`)
              .collection("cart")
              .get()
              .then((querySnapshot) => {
                let collections = [];
                querySnapshot.forEach((doc) => {
                  collections.push({ id: doc.id, data: doc.data() });
                });
                res.send(collections);
              });
          });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.json({ catchError: err });
    });
});

app.get("/checkNumber", (req, res) => {
  const phone = parseInt(req.query.phone);
  console.log('phone ', phone);
  db.collection("userTable")
    .where("phone", "==", phone)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
          // const apiKey = 'YEEIqHvOpDk-aKTD4KGyqhuZImjTnPLxah98P6OMdd';
          // const message = `Please use ${otp} to verify phone number`;
          // const otp = Math.floor(1000 + Math.random() * 9000);
          // const url = `https://api.textlocal.in/send/?apikey=${apiKey}&numbers=91${phone}&message=${message}&sender=TXTLCL`;

          // https.get(url);
          res.json({success: true, msg: 'OTP sent'});
          return;
        }  

        res.json({success: false, msg: 'Phone number already registered'});
      })
      .catch((err) => {
        res.status(500).json({ error: "Something went wrong", err: err });
      });


});

app.get("/checkNumberForgotPass", (req, res) => {
  const phone = parseInt(req.query.phone);
  console.log('phone ', phone);
  db.collection("userTable")
    .where("phone", "==", phone)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
          res.json({success: false, msg: 'Phone number not registered with us'});
          return;
        }  
        let userId = [];
        snapshot.forEach((doc) => {
          userId.push({ userId: doc.id });
        });
        res.json({success: true, userId: userId, msg: 'OTP sent'});
      })
      .catch((err) => {
        res.status(500).json({ error: "Something went wrong", err: err });
      });
});

app.post("/changePassword", (req, res) => {
  const userId = req.body.userId;
  const password = req.body.password;
  db.collection("userTable")
    .doc(userId)
    .update({
      password
    })
    .then(() => {
      return res.json({success:true, msg: "Password updated successfully!!!"});
    })
    .catch((err) => {
      console.error(err);
      return res.json({success:false, msg: "somethig went wrong" });
    });
});

app.get("/getZipCodes", (req,res)=> {
  
    db.collection("zipTable")
      .doc("zip")
      .get()
      .then((doc) => {
        res.json({success: true, data: doc.data()})
      })
      .catch((err) => {
        res
          .status(500)
          .json({ success: false, error: "Something went wrong", err: err });
      });
                
})

app.post("/setZipCodes", (req,res)=> {
  const zipCodes = req.body.zipCodes;

  db.collection("zipTable")
    .doc("zip")
    .update(zipCodes)
    .then((doc) => {
      res.json({success: true, msg:'ZIP codes updated successfully'});
    })
    .catch((err) => {
      res
        .status(500)
        .json({ success: false, error: "Something went wrong", err: err });
    });
              
})


app.post("/addUser", (req, res) => {
  const newUser = {
    username: req.body.username,
    password: req.body.password,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    role: 0,
    token: "",
    resetToken: "",
    resetTokenExp: "",
  };
  db.collection("userTable")
    .where("username", "==", req.body.username)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        db.collection("userTable")
          .add(newUser)
          .then((doc) => {
            res.json({
              success: true,
              msg: `User ${doc.id} created successfully`,
            });
          })
          .catch((err) => {
            res.status(500).json({ error: "Something went wrong", err: err });
          });
        return;
      }

      res.json({ success: false, msg: "Username already exists" });
      // snapshot.forEach(doc => {
      //   console.log(doc.id, '=>', doc.data());
      // });
    })
    .catch((err) => {
      res.status(500).json({ error: "Something went wrong", err: err });
    });
});

app.post("/login", (req, res) => {
  db.collection("userTable")
    .where("username", "==", req.body.username)
    .get()
    .then((snapshot) => {
      // if username not found
      if (snapshot.empty) {
        res.json({ success: false, msg: "Username does not exists" });
        return;
      }
      // if username found match password
      const userData = {};
      let isMatch = false;
      // const user_id = "";
      snapshot.forEach((doc) => {
        //let req_data = {};
        let username = doc.data().username;
        let password = doc.data().password;

        if (username == req.body.username && password == req.body.password) {
          isMatch = true;
          for (const data in doc.data()) {
            if (
              data !== "resetToken" &&
              data !== "resetTokenExp" &&
              data !== "password" &&
              data !== "token"
            ) {
              userData[data] = doc.data()[data];
            }
          }
          // userData.push(doc.data());
          userData.userId = doc.id;
        }
      });

      if (!isMatch) {
        return res.json({
          success: false,
          msg: "Auth failed, Wrong password",
        });
      } else {
        //generate token
        const user_id = userData.userId;
        const username = userData.username;
        const token = jwt.sign(username,SECRET);

        // update token for user
         db.collection("userTable")
         .doc(user_id)
         .update({token})
        
        res.status(200).json({
          success: true,
          userData: userData,
          __u_t: token
        });
      }
    })
    .catch((err) => {
      res
        .status(500)
        .json({ error: "Something went wrong", err: JSON.stringify(err) });
    });
});

app.get("/logout", (req, res)=> {
  let userId = req.query.userId;
  db.doc(`/userTable/${userId}`)
    .update({token:""})
    .then((data) => {
      return res.json({success:true, msg: "Logout successfully"});
    })
    .catch((err) => {
      console.error(err);
      return res.json({success:false, error: "somethig went wrong" });
    });
})

app.get("/getUserById", (req, res) => {
  let userId = req.query.id;
  db.doc(`/userTable/${userId}`)
    .get()
    .then((data) => {
      return res.send(data.data());
    })
    .catch((err) => {
      console.error(err);
      return res.json({ error: "somethig went wrong" });
    });
});

////////////////////////
///// PRODUCTS
///////////////////////

app.get("/getProductsByBrand", (req, res) => {
  const brand = req.query.brand;
  
    db.collection("productTable")
      .where("brand", "==", brand)
      .get()
      .then((data) => {
        let products = [];
        data.forEach((doc) => {
          let product = {
            productId: doc.id,
            ...doc.data(),
          };
          products.push(product);
        });
        return res.json({ success: true, data: products });
      })
      .catch((err) => {
        res
          .status(500)
          .json({ success: false, error: "Something went wrong", err: err });
      });
  
});

app.post("/getProductsByCatBrand", (req, res) => {
  // this will be the name of the category or brand
  const field = req.body.field;
  // this will be category or brand
  const filterBy = req.body.filterBy;
  const productNo = req.body.productNo;

  let productRef = "";
  if (productNo !== "0") {
    const lastProduct = req.body.last;
    productRef = db
      .collection("productTable")
      .where(filterBy, "==", field)
      .orderBy("productNo", "desc")
      .startAfter(lastProduct.productNo);
  } else {
    productRef = db
        .collection("productTable")
        .where(filterBy, "==", field)
        .orderBy("productNo", "desc")
  }
    productRef
      .limit(2)
      .get()
      .then(snapshot => {
          if(snapshot.empty) {
            return res.json({ success: false, msg:"No products found" });
          }

            let products = [];
            snapshot.forEach((doc) => {
              let product = {
                productId: doc.id,
                ...doc.data(),
              };
              products.push(product);
            });
            const last = {
              productNo: snapshot.docs[snapshot.docs.length - 1].data().productNo
            };
            return res.json({ success: true, products, last });
      })
      .catch((err) => {
        res
          .status(500)
          .json({ success: false, error: "Something went wrong", err: err });
      });
  
});

app.get("/search", (req, res) => {
  const searchString = req.query.searchString;
  db.collection("productTable")
    .get()
    .then((data) => {
      let products = [];
      data.forEach((doc) => {
        const searchBy = new RegExp(searchString, "i");
        if (searchBy.test(doc.data().name)) {
          let product = {
            productId: doc.id,
            ...doc.data(),
          };
          products.push(product);
        }
      });
      return res.json({ success: true, data: products });
    })
    .catch((err) => {
      console.error(err);
      return res.json({ error: "somethig went wrong" });
    });
});

app.post("/getProductsBy", (req, res) => {
  const categories = req.body.filterCategorys;
  const brands = req.body.filterbrands;
  if (categories.length > 0) {
    db.collection("productTable")
      .where("category", "in", categories)
      .get()
      .then((data) => {
        let products = [];
        data.forEach((doc) => {
          let product = {
            productId: doc.id,
            ...doc.data(),
          };
          products.push(product);
        });
        return products;
      })
      .then((category) => {
        if (brands.length > 0) {
          db.collection("productTable")
            .where("brand", "in", brands)
            .get()
            .then((data) => {
              let products = [];
              data.forEach((doc) => {
                let product = {
                  productId: doc.id,
                  ...doc.data(),
                };
                products.push(product);
              });

              category.forEach((data_) => {
                products.push(data_);
              });
              return res.json(products);
            });
        } else {
          return res.json(category);
        }
      })
      .catch((err) => {
        console.error(err);
        return res.json({ error: "somethig went wrong" });
      });
  } else if (brands.length > 0) {
    db.collection("productTable")
      .where("brand", "in", brands)
      .get()
      .then((data) => {
        let products = [];
        data.forEach((doc) => {
          let product = {
            productId: doc.id,
            ...doc.data(),
          };
          products.push(product);
        });
        return res.json(products);
      })
      .catch((err) => {
        console.error(err);
        return res.json({ error: "somethig went wrong" });
      });
  }
});

app.get("/getAllFilters", (req, res) => {
  db.collection("categoryTable")
    .get()
    .then((data) => {
      let categories = [];
      data.forEach((doc) => {
        categories.push({id: doc.id, category: doc.data().category});
      });
      return categories;
    })
    .then((categories) => {
      db.collection("brandTable")
        .get()
        .then((data) => {
          let brands = [];
          data.forEach((doc) => {
            brands.push({id: doc.id, brand: doc.data().brand});
          });
          let filterData = { categories, brands };
          return res.json({ success: true, filterData });
        });
    })
    .catch((err) => console.error(err));
});

app.get("/getProducts", (req, res) => {
  db.collection("productTable")
    .get()
    .then((data) => {
      let products = [];
      data.forEach((doc) => {
        let product = {
          productId: doc.id,
          ...doc.data(),
        };
        products.push(product);
      });
      return res.json(products);
    })
    .catch((err) => console.error(err));
});

app.post("/getProductsByNumber", (req, res) => {
  const productNo = req.body.productNo;
  const lastProduct = req.body.last;
  console.log("req.body ", req.body);

  let productRef = "";
  if (productNo !== "0") {
    productRef = db
      .collection("productTable")
      .orderBy("productNo", "desc")
      .startAfter(lastProduct.productNo);
  } else {
    console.log("inside else ", productNo);
    productRef = db.collection("productTable").orderBy("productNo", "desc");
  }
  productRef
    .limit(5)
    .get()
    .then((data) => {
      let products = [];

      data.forEach((doc) => {
        let product = {
          productId: doc.id,
          ...doc.data(),
        };
        products.push(product);
      });
      // Get the last document
      const last = {
        productNo: data.docs[data.docs.length - 1].data().productNo,
      };

      return res.json({ success: true, products, last });
    })
    .catch((err) => {
      res
        .status(500)
        .json({ success: false, error: "Something went wrong", err: err });
    });
});

app.post("/getProductsByTimestamp", (req, res) => {
  const isStart = req.body.isStart;
  const lastProduct = req.body.last;
  let productRef = "";

  if (isStart !== "true") {
    console.log("inside if");
    // const startAfterTime = new Date(timeStamp);

    productRef = db
      .collection("productTable")
      .orderBy("createdAt", "desc")
      .startAfter(lastProduct.createdAt);
  } else {
    console.log("inside else");
    productRef = db.collection("productTable").orderBy("createdAt", "desc");
  }
  productRef
    .limit(5)
    .get()
    .then((data) => {
      let products = [];
      data.forEach((doc) => {
        let product = {
          productId: doc.id,
          ...doc.data(),
        };
        products.push(product);
      });
      return res.json(products);
    })
    .catch((err) => console.error(err));
});

app.put("/updateProduct", admin_check, (req, res) => {
  const product = req.body;
  const productId = req.body.productId;
  const updateProduct = {
    category: req.body.category,
    brand: req.body.brand,
    name: req.body.name,
    price: req.body.price,
    pricePerQuantity: req.body.pricePerQuantity,
    img: req.body.img,
    updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
    description: req.body.description,
    mrp: req.body.mrp,
  };

  db.collection("productTable")
    .doc(productId)
    .set(updateProduct, { merge: true })
    .then((data) => {
      res.json({
        success: true,
        msg: `Product updated successfully`,
        data: product,
      });
    })
    .catch((err) => {
      console.error("err ", err);
      res.status(500).json({
        success: false,
        msg: "Something went wrong, Please try again",
        err: JSON.stringify(err),
      });
    });
});

app.put("/setAvaibility", admin_check, (req, res) => {
  const available = req.body.available;
  const productId = req.body.productId;
  db.collection("productTable")
    .doc(productId)
    .set({ available }, { merge: true })
    .then(() => {
      return res.json({
        success: true,
        msg: "Available status updated successfully",
      });
    })
    .catch((err) => {
      res
        .status(500)
        .json({ success: false, error: "Something went wrong", err: err });
    });
});

app.post("/deleteProductById", admin_check, (req, res) => {
  const productId = req.body.productId;
  const images = req.body.img;

  db.collection("productTable")
    .doc(productId)
    .delete()
    .then(() => {
      /* delete image related to product */
      const forLoop = async (_) => {
        console.log("start");
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          await bucket.file(img).delete().then();
        }
        console.log("end");
      };
      forLoop();
      res.json({ success: true, msg: "Product deleted successfully" });
    })
    .catch((err) => {
      res.json({
        success: false,
        msg: "Cannot delete document, Please try again",
      });
    });
});

app.post("/addBrand",admin_check, (req, res) => {
  // add brand to the brand table
  // only unique brands will be allowed
  db.collection("brandTable")
    .where("brand", "==", req.body.brand)
    .get()
    .then((snapshot) => {
      // if brand not found
      if (snapshot.empty) {
        const brand = {
          brand: req.body.brand,
          img: req.body.img,          
          showOnHome: req.body.showOnHome,
          createdAt: admin.firestore.Timestamp.fromDate(new Date()),
        };

        db.collection("brandTable")
          .add(brand)
          .then((doc) => {
            if(brand.showOnHome){
              const brandId = doc.id;
              db.collection("homeTable")
                .doc("showBrands")
                .update({
                  brands: admin.firestore.FieldValue.arrayUnion(brandId)
                })
              }
            res.json({ success: true, msg: `Brand added successfully` });
          })
          .catch((err) => {
            res.status(500).json({
              success: false,
              msg: "Something went wrong, Please try again",
              err: err,
            });
          });
      } else {
        res.json({ success: false, msg: `Brand already exists` });
      }
    })
    .catch((err) => {
      res.status(500).json({
        success: false,
        msg: "Something went wrong, Please try again",
        err: err,
      });
    });
});

app.post("/addCategory", admin_check, (req, res) => {
  // add category to the category table
  // only unique categories will be allowed
  // we can use this for filtering in app
  db.collection("categoryTable")
    .where("category", "==", req.body.category)
    .get()
    .then((snapshot) => {
      // if category not found
      if (snapshot.empty) {
        const category = {
          category: req.body.category,
          img: req.body.img,
          showOnHome: req.body.showOnHome,
          createdAt: admin.firestore.Timestamp.fromDate(new Date()),
        };

        db.collection("categoryTable")
          .add(category)
          .then((doc) => {
            if(category.showOnHome){
            const categoryId = doc.id;
            db.collection("homeTable")
              .doc("showCategorys")
              .update({
                category: admin.firestore.FieldValue.arrayUnion(categoryId)
              })
            }

            res.json({ success: true, msg: `Category added successfully` });
          })
          .catch((err) => {
            res.status(500).json({
              success: false,
              msg: "Something went wrong, Please try again",
              err: err,
            });
          });
      } else {
        res.json({ success: false, msg: `Category already exists` });
      }
    })
    .catch((err) => {
      res.status(500).json({
        success: false,
        msg: "Something went wrong, Please try again",
        err: err,
      });
    });
});

app.post("/addProducts", admin_check, (req, res) => {
  let counter = 0;
  db.collection("productTable")
    .get()
    .then((snap) => {
      console.log("size ", snap.size);
      counter = snap.size + 1;
      const newProduct = {
        category: req.body.category,
        brand: req.body.brand,
        name: req.body.name,
        price: req.body.price,
        pricePerQuantity: req.body.pricePerQuantity,
        img: req.body.img,
        available: true,
        createdAt: admin.firestore.Timestamp.fromDate(new Date()),
        productNo: counter,
        description: req.body.description,
        mrp: req.body.mrp,
      };
      db.collection("productTable")
        .add(newProduct)
        .then((doc) => {
          res.json({ success: true, msg: `Product added successfully` });
        })
        .catch((err) => {
          res.status(500).json({
            success: false,
            msg: "Something went wrong, Please try again",
            err: err,
          });
        });
    });
});

app.get('/chcekAuth', auth, (req, res) => {
  res.status(200).json({success: true, user: req.user});
})

exports.api = functions.region("asia-northeast1").https.onRequest(app);
