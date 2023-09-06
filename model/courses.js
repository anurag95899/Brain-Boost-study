var mongoose = require("mongoose");


var coursesSchema = mongoose.Schema({
  thumnail: String,
  coursestittle: String,
  coursesdes: String,
  date: String,
  price: {
    type: Number,
    default: 0
  },
  actualprice: {
    type: Number,
    default: 0
  },
  coursesdetails: String,
  totalnoofclasses: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  allmodules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'modules'
  }],
}
  ,
  {
    timestamps: true
  }
);

module.exports = mongoose.model('courses', coursesSchema);