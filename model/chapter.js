var mongoose = require("mongoose");


var chapterSchema = mongoose.Schema({
    chapter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "module"
    },
    topics: String

}
    ,
    {
        timestamps: true
    }
);

module.exports = mongoose.model('chapter', chapterSchema);