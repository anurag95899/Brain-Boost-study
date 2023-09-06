var mongoose = require("mongoose");


var modulesSchema = mongoose.Schema({
    courses: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "courses"
    },
    module: String,
    allchapter: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'chapter'
    }],
}
    ,
    {
        timestamps: true
    }
);

module.exports = mongoose.model('modules', modulesSchema);