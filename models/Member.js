const mongoose = require("mongoose");

const MemberSchema = mongoose.Schema({
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
    books: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            required: false,
        },
    ],
});

const Member = mongoose.model("Member", MemberSchema);

module.exports = Member;
