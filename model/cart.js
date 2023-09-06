var mongoose = require("mongoose");


const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            course: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Courses',
                required: true
            },
            amount: {
                type: Number,
                required: true
            }
        }
    ],

},
    {
        timestamps: true
    }
);

module.exports = mongoose.model('cart', cartSchema);

