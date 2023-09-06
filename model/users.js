var mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/brainboost")
  .then(function (created) {
    console.log("created")
  })

var userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  buycources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "courses"
  }],
  otp: {
    type: String,
    default: ""
  },
  password: String,
  profileimg: String,
  admin: {
    type: Boolean,
    default: false
  },
  whatsappnumber: String
},
  {
    timestamps: true
  }
);

userSchema.plugin(plm, { usernameField: "email" });
module.exports = mongoose.model('user', userSchema);