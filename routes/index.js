var express = require('express');
var router = express.Router();
const userModel = require("../model/users");
const coursesModel = require("../model/courses");
const passport = require("passport")
const localStrategy = require("passport-local");
const multer = require("multer");
const mongoose = require('mongoose');
const crypto = require('crypto')
const { GridFsStorage } = require('multer-gridfs-storage');
const connect = mongoose.connection;
const gridfsStream = require('gridfs-stream');
const { upload, coursesUpload } = require('../grid')
const cartmodel = require('../model/cart')
const nodemailer = require("../nodemailer")
const moduleModel = require('../model/module')
const fs = require("fs");
const Razorpay = require('razorpay')
passport.use(new localStrategy({ usernameField: "email", usernameQueryFields: ["email"], }, userModel.authenticate()));


var instance = new Razorpay({
  key_id: 'rzp_test_XClQ5fq0NJNtwe',
  key_secret: 'fuvZgwgZXBkzKVbRs34J6bpj',
});

const GoogleStrategy = require('passport-google-oidc');

require('dotenv').config()

passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/oauth2/redirect/google',
  scope: ['email', 'profile']
}, async function verify(issuer, profile, cb) {
  user = await userModel.findOne({ email: profile.emails[0].value })
  if (user) {
    return cb(null, user)
  } else {

    let newUser = await userModel.create({ name: profile.displayName, email: profile.emails[0].value })
    newUser.save();
    return cb(null, newUser);
  }

}));


router.get('/login/federated/google', passport.authenticate('google'));

router.get('/oauth2/redirect/google', passport.authenticate('google', {
  successRedirect: '/',
  failureRedirect: '/signup/newuser'
}));

//gridfs engine strogage

let gfs
let gfsCourses
let gfsBucket
let gfsBucketCourses

connect.once('open', function () {
  gfs = gridfsStream(connect.db, mongoose.mongo)
  gfsCourses = gridfsStream(connect.db, mongoose.mongo)
  gfs.collection('user')
  gfsCourses.collection('courses')
  gfsBucket = new mongoose.mongo.GridFSBucket(connect.db, {
    bucketName: 'user',
  })
  gfsBucketCourses = new mongoose.mongo.GridFSBucket(connect.db, {
    bucketName: 'courses',
  })
})

// profileimage upload router
router.post('/upload', upload.single("filename"), function (req, res) {
  userModel.findOne({ email: req.user.email })
    .then(function (user) {
      user.profileimg = req.file.filename;
      user.save()
        .then(function () {
          res.redirect("/profile");
        })
    })
});

//image stream router
router.get("/getFile/:filename", function (req, res) {
  gfs.files.findOne({ filename: req.params.filename }).then(function () {
  })
  gfsBucket.openDownloadStreamByName(req.params.filename).pipe(res);
})

//courses image stream router
router.get("/getCourses/:filename", function (req, res) {
  gfsCourses.files.findOne({ filename: req.params.filename }).then(function () {
  })
  gfsBucketCourses.openDownloadStreamByName(req.params.filename).pipe(res);
})


//Courses router
router.post('/coursesupload', coursesUpload.single("coursesupload"), async function (req, res) {
  try {
    const loggedinuser = await userModel.findOne({ username: req.user.username })
    let videocreated = await coursesModel.create({
      video: req.file.filename,
      tittle: req.body.tittle,
      userid: loggedinuser._id,
    })
    loggedinuser.videos.push(videocreated);
    await loggedinuser.save();
    res.redirect('/')
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
});


// login page 
router.get('/signIn', isLoggedOut, function (req, res) {
  res.render('login');
});



router.get('/loginuser', isLoggedOut, function (req, res) {
  res.render('loginuser');
});

//signUp page
router.get('/signup/newuser', isLoggedOut, function (req, res) {
  res.render('signup');
});

router.get('/', async function (req, res) {
  if (req.isAuthenticated()) {
   let loginuser = await userModel.findOne({ email: req.user.email })
    let cources = await coursesModel.find().limit(8).skip(0)   
  res.render('Home', { loginuser, cources });
  } else {
    res.render('login');
  }
});

//cources page
router.get('/courses/', isLoggedIn, async function (req, res) {
  let loginuser = await userModel.findOne({ email: req.user.email })
  let allcourses = await coursesModel.find()
  res.render('courses',{ loginuser, allcourses });
});

//profile page
router.get('/profile', isLoggedIn, async function (req, res) {
  let loginuser = await userModel.findOne({ email: req.user.email }).populate("buycources")
  res.render('profile', { loginuser });
});

//update user details

router.post('/update', isLoggedIn, async function (req, res) {
  let loginuser = await userModel.findOne({ email: req.user.email })
  let updateuserdets = await userModel.findOneAndUpdate({email: req.user.email},{
    name: req.body.name,
    email: req.body.email,
    whatsappnumber: req.body.whatsappnumber,
  })
  res.redirect("/profile")
});

//Add Courses 
router.get('/addcourses', isLoggedIn, coursesUpload.single("coursesupload"), async function (req, res) {
  let loginuser = await userModel.findOne({ email: req.user.email })
  res.render('addcourses', { loginuser });
});

router.post('/createcourses', isLoggedIn, coursesUpload.single("coursesupload"), async function(req, res){
  let loginuser = await userModel.findOne({ email: req.user.email })
  let coursesCreated = coursesModel.create({
    thumnail: req.file.filename,
    coursestittle: req.body.coursestittle,
    coursesdes: req.body.coursesdes,
    price: req.body.price,
    date: req.body.date,
    actualprice: req.body.actualprice,
    coursesdetails: req.body.coursesdetails,
    rating: req.body.rating,
    totalnoofclasses: req.body.totalnoofclasses,
  })
   res.redirect("/courses")
})

// edit page render

router.get("/editcourse/:courses", async function(req, res){
  let loginuser = await userModel.findOne({email: req.user.email})
  let editcourses = await coursesModel.findOne({_id: req.params.courses})
   res.render("editcourses", {loginuser, editcourses})
})

//update courses router
router.post('/updatecourses/:id', isLoggedIn,function(req, res){
   coursesModel.findOneAndUpdate({_id:req.params.id },
    {
    coursestittle: req.body.coursestittle,
    coursesdes: req.body.coursesdes,
    price: req.body.price,
    date: req.body.date,
    actualprice: req.body.actualprice,
    coursesdetails: req.body.coursesdetails,
    rating: req.body.rating,
    totalnoofclasses: req.body.totalnoofclasses,
  })
  .then(function(data){
    res.redirect("/courses")
  })
})


//delete courses
router.post('/deletecourse/:id', isLoggedIn, async function(req, res){
  let loginuser =await userModel.findOne({email: req.user.email})
  let deletecourse =await coursesModel.findOneAndDelete({_id:req.params.id})
  res.redirect('back')
})


//coursesdetailes router

router.get('/coursesDetailes/:courses',isLoggedIn, async function(req, res){
  let loginuser = await userModel.findOne({email: req.user.email})
  let coursesdetailes = await coursesModel.findOne({coursestittle: req.params.courses}).populate("allmodules")
  res.render('coursesdets', {loginuser, coursesdetailes})
})

//module router

router.post("/module/:id", isLoggedIn, async function(req, res){
    let loginuser = await userModel.findOne({email: req.user.email})
    let currentcourses = await coursesModel.findOne({_id: req.params.id})
    let newmodules = await moduleModel.create({
      module: req.body.module,
      courses: currentcourses._id
    })
    currentcourses.allmodules.push(newmodules)
    await currentcourses.save()
    res.redirect("back")
})


//delete a module

router.get("/deletemodule/:id", isLoggedIn, async function(req, res){
  const loginuser = await userModel.findOne({ email: req.user.email });
  const currentCourse = await coursesModel.findOne({ allmodules: req.params.id }).populate('allmodules');
  const deleteModule = await moduleModel.findOneAndDelete({ _id: req.params.id });
  let index = currentCourse.allmodules.indexOf(deleteModule)
  currentCourse.allmodules.splice(index,1)
  await currentCourse.save()
  res.redirect('back')
})


//edit module page
router.get("/editmodule/:id", isLoggedIn, async function(req, res){
  const loginuser = await userModel.findOne({ email: req.user.email });
  const currentCourse = await coursesModel.findOne({ allmodules: req.params.id }).populate('allmodules');
  const editModule = await moduleModel.findOne({ _id: req.params.id })
  res.render("editmodule",{editModule, loginuser})
})


// update Module router
router.post("/updatemodule/:id", isLoggedIn, async function(req, res){
  const loginuser = await userModel.findOne({ email: req.user.email });
  const currentCourse = await coursesModel.findOne({ allmodules: req.params.id }).populate('allmodules');
  const editModule = await moduleModel.findOneAndUpdate({ _id: req.params.id },{
      module:req.body.module
  })
  res.redirect('/courses')
})

//payment

router.post('/create/orderId/:course_id', isLoggedIn, async function (req, res) {
  let user = userModel.findOne({email: req.user.email})
  let selectedCourse = await coursesModel.findOne({_id: req.params.course_id}); 
  var options = {
    amount: selectedCourse.actualprice * 100,  // amount in the smallest currency unit
    currency: "INR",
    receipt: "order_rcptid_11"
  };
  instance.orders.create(options, function (err, order) {
    // console.log(order);
    res.send(order)
  });
});

// Add course to user's buyCourses array
router.post('/add/course/:course_id', isLoggedIn, async function (req, res) {
  let user = await userModel.findOne({ email: req.user.email });

  // Retrieve the course ID from the request parameters
  let courseId = req.params.course_id;

  // Add the course ID to the user's buyCourses array
  user.buycources.push(courseId);

  try {
    await user.save();
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to add course to user' });
  }
});

// classrome page
router.get('/classroom', isLoggedIn, async function (req, res) {
    let loginuser = await userModel.findOne({email: req.user.email}).populate("buycources")
    res.render("classroom",{loginuser})
});


router.post("/api/payment/verify", async function(req, res){
  let loginuseruser = await userModel.findOne({email: req.user.email})
  let body=req.body.response.razorpay_order_id + "|" + req.body.response.razorpay_payment_id;
 
   var crypto = require("crypto");
   var expectedSignature = crypto.createHmac('sha256', 'fuvZgwgZXBkzKVbRs34J6bpj')
                                   .update(body.toString())
                                   .digest('hex');
                                   console.log("sig received " ,req.body.response.razorpay_signature);
                                   console.log("sig generated " ,expectedSignature);
   var response = {"signatureIsValid":"false"}
   if(expectedSignature === req.body.response.razorpay_signature)
    response={"signatureIsValid":"true"}
       res.send(response);
});

//register new user

router.post('/register', function (req, res) {
  var newuser = new userModel({
    name: req.body.name,
    email: req.body.email,
    whatsappnumber: req.body.whatsappnumber,
    profileimg: req.body.profileimg,
  })
  userModel.register(newuser, req.body.password)
    .then(function (userdets) {
      passport.authenticate('local')(req, res, function () {
        res.redirect("/");
      })
    }).
    catch(err => {
      res.status(402).json({ status: "Failed", message: err })
    })
})

//login router
router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/signIn'
}), function (req, res) { });



//logout router
router.get('/logout', isLoggedIn, function (req, res) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/signIn');
  });
});


//forget

router.get('/forget', function(req, res) {
  res.render('forget');
});

router.post('/forgot', function(req, res) {
  userModel.findOne({ email: req.body.email })
    .then(async function(user) {
      if (user) {
        crypto.randomBytes(17, async function(err, buff) {
          const otpstr = buff.toString("hex");
          user.otp = otpstr;
          user.timestamp = Date.now(); // Set the timestamp
          await user.save();

          nodemailer(req.body.email, otpstr, user._id).then(function() {
            console.log("send mail");
          });

          // Schedule OTP expiration after 5 minutes
          setTimeout(async function() {
            user.otp = ""; // Disable OTP
            user.timestamp = undefined; // Clear the timestamp
            await user.save();
          }, 15 * 60 * 1000); // 5 minutes in milliseconds
        });
      } else {
        res.send("not send");
      }
    });
});



router.get('/forgot/:id/otp/:otp',async function(req, res) {
  let user = await userModel.findOne({_id : req.params.id})
  if(user.otp === req.params.otp){
    res.render('reset', {id: req.params.id})
  }
  else{
    res.send("worng or expired link  ")
  }
});


router.post('/reset/:id', async function(req, res) {
  const user = await userModel.findOne({ _id: req.params.id });

  if (!user) {
    res.send("User not found.");
    return;
  }

  if (!user.otp) {
    res.send("OTP has expired. Please generate a new one.");
    return;
  }

  user.setPassword(req.body.newpassword, async function() {
    user.otp = "";
    user.timestamp = undefined; // Clear the timestamp
    await user.save();
    res.redirect('/profile');
  });
});



function isLoggedOut(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect("/")
  }
  else {
    return next();
  }
}



function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    res.redirect("/signIn")
  }
}


module.exports = router;



// router.get("/home", isLoggedIn, async function (req, res) {
//   try {
//     const users = await userModel.find({});
//     const randomSubset = getRandomSubset(users, 2); // Change 5 to the desired number of users to display
//     let user = await userModel
//       .findOne({ username: req.user.username })
//       .populate("following")
//       .populate("stories");
//     let alluser = await userModel.find().populate("stories");
//     let storyUsers = await userModel.find().populate("stories");
//     let posts = await postModel.find().limit(8).skip(0).populate("owner");
//     res.render("home", {
//       posts: posts,
//       user: user,
//       storyUsers: storyUsers,
//       alluser: randomSubset,
//     });
//     // res.render('home', { users: randomSubset });
//   } catch (error) {
//     res.status(500).json({ error: "Internal server error" });
//   }
// });
