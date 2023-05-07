const mongoose = require("mongoose");

const BookSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    desc: {
        type: String,
        required: true,
    },
    img: {
        type: String,
        required: false,
    },
    status: {
        available: {
            type: Boolean,
            required: true,
            default: true,
        },
        borrower: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Member",
            default: null,
        },
    },
});

const Book = mongoose.model("Book", BookSchema);

module.exports = Book;
