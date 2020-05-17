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
//const bcrypt = require("bcrypt");
//const jwt = require("jsonwebtoken");
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

const { auth } = require("./middleware/auth");
const { admin_ } = require("./middleware/admin");

////////////////////////
///// Models
///////////////////////
//const { User } = require("./models/user");
const SECRET = "SUPERSECRETPASSWORD123";

////////////////////////
///// ORDER
///////////////////////

app.post("/addOrder", (req, res) => {
  const newOrder = {
    userId: req.body.userId,
    total: req.body.total,
    products: req.body.products,
    status: "active",
    createdAt: admin.firestore.Timestamp.fromDate(new Date()),
  };
  db.collection("orderTable")
    .add(newOrder)
    .then((doc) => {
      const orderId = doc.id;
      res.json({ success: true, msg: `Order placed successfully. Check notifications under My Account for order update` });
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
        .create({ orderId: orderId })
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

app.get("/getActiveOrders", (req, res) => {
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

app.get("/getOrdersByStatus", (req, res) => {
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

app.put("/setOrderStatus", (req, res) => {
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

app.put("/setOrderMsg", (req, res) => {

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

app.get("/getOrders", (req, res) => {
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

app.get("/getOrdersByDate", (req, res) => {
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

app.post("/addProductImage", (req, res) => {
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

app.post("/successBuy", (req, res) => {
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

app.get("/getPurchaseHistory", (req, res) => {
  const userId = req.query.userId;
  db.doc(`/userTable/${userId}`)
    .collection("history")
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
                if(doc.exists) {
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
    .then((data)=>{
      res.json({success: true, data})
    })
    .catch((err) => {
      console.error(err);
      return res.json({ success: false, msg: err });
    });
});

app.post("/removefromCart", (req, res) => {
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

app.post("/getCartDetails", (req, res) => {
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

app.post("/addToCart", (req, res) => {
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

app.post("/addUser", (req, res) => {
  const newUser = {
    username: req.body.username,
    password: req.body.password,
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
              data !== "password"
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
        //const user = userData[0];
        //console.log("user ", user);
        //let token = jwt.sign(user_id.toHexString(), SECRET);
        // const token = jwt.sign(user_id,SECRET);
        //  user.token = token;
        //  console.log("token ", token);
        // update token for user
        // db.collection("userTable")
        // .doc(user_id)
        // .update({token:user.token})
        // .then()

        res.status(200).json({
          success: true,
          userData: userData,
        });
      }
    })
    .catch((err) => {
      res
        .status(500)
        .json({ error: "Something went wrong", err: JSON.stringify(err) });
    });
});

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
        categories.push(doc.data());
      });
      return categories;
    })
    .then((categories) => {
      db.collection("brandTable")
        .get()
        .then((data) => {
          let brands = [];
          data.forEach((doc) => {
            brands.push(doc.data());
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

app.put("/updateProduct", (req, res) => {
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

app.put("/setAvaibility", (req, res) => {
  const available = req.body.available;
  const productId = req.body.productId;
  db.collection("productTable")
    .doc(productId)
    .set(
      { available },
      { merge: true }
    )
    .then(() => {
      return res.json({ success: true, msg: "Available status updated successfully" });
    })
    .catch((err) => {
      res
        .status(500)
        .json({ success: false, error: "Something went wrong", err: err });
    });
});

app.post("/deleteProductById", (req, res) => {
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

app.post("/addProducts", (req, res) => {
  const newProduct = {
    category: req.body.category,
    brand: req.body.brand,
    name: req.body.name,
    price: req.body.price,
    pricePerQuantity: req.body.pricePerQuantity,
    img: req.body.img,
    available: true,
    createdAt: admin.firestore.Timestamp.fromDate(new Date()),
  };
  db.collection("productTable")
    .add(newProduct)
    .then((doc) => {
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
            };
            db.collection("categoryTable")
              .add(category)
              .then(() => {
                return true;
              });
          }
        });

      // add brand to the brand table
      // only unique brands will be allowed
      db.collection("brandTable")
        .where("brand", "==", req.body.brand)
        .get()
        .then((snapshot) => {
          // if category not found
          if (snapshot.empty) {
            const brand = {
              brand: req.body.brand,
            };
            db.collection("brandTable")
              .add(brand)
              .then(() => {
                return true;
              });
          }
        });

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

exports.api = functions.region("asia-northeast1").https.onRequest(app);
