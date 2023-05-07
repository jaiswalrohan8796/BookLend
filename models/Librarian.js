const mongoose = require("mongoose");

const LibrarianSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
});

const Librarian = mongoose.model("Librarian", LibrarianSchema);

module.exports = Librarian;
