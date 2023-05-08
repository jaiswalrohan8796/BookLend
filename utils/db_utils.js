const Librarian = require("../models/Librarian.js");
const Member = require("../models/Member.js");
const Book = require("../models/Book.js");
const { ObjectId } = require("bson");
const { func } = require("joi");

async function findByUsername(role, username) {
    try {
        if (role === "Librarian") {
            const librarian = await Librarian.findOne({
                username: username,
            }).exec();
            return librarian ? librarian : null;
        } else if (role === "Member") {
            const member = await Member.findOne({ username: username }).exec();
            return member ? member : null;
        }
    } catch (err) {
        console.log(err);
        return null;
    }
}

async function findById(role, id) {
    try {
        if (role === "Librarian") {
            const librarian = await Librarian.findOne({
                _id: id,
            }).exec();
            return librarian ? librarian : null;
        } else if (role === "Member") {
            const member = await Member.findOne({ _id: id }).exec();
            return member ? member : null;
        } else if (role === "Book") {
            const book = await Book.findOne({ _id: id }).exec();
            return book ? book : null;
        }
    } catch (err) {
        console.log(err);
        return null;
    }
}

async function fetchAllBooks() {
    try {
        const books = await Book.find().exec();
        for (let i = 0; i < books.length; i++) {
            books[i] = await books[i].populate("status.borrower");
        }
        return books;
    } catch (err) {
        console.log(err);
        return null;
    }
}

async function fetchAllMembers() {
    try {
        const members = await Member.find().exec();
        for (let i = 0; i < members.length; i++) {
            members[i] = await members[i].populate("books");
        }
        return members;
    } catch (err) {
        console.log(err);
        return null;
    }
}

async function borrowBooktoMember(memberId, bookId) {
    try {
        const member = await findById("Member", memberId);
        const book = await findById("Book", bookId);
        //Check book status
        if (book.status.available != true) {
            console.log("Book not available");
            return { success: false, error: "Book not available" };
        }
        //update member books
        member.books.push(book._id);
        await member.save();
        //update book status to unavailable
        book.status.available = false;
        book.status.borrower = new ObjectId(member._id);
        await book.save();
        return { success: true, error: "" };
    } catch (err) {
        console.log(err);
        return { success: false, error: "Internal Server Error" };
    }
}

async function updateMemberBooks(member, bookId) {
    //Update member books
    member.books = member.books.filter((item) => {
        return bookId != item.toString();
    });
    await member.save();
    return true;
}

async function updateBookToAvailable(book) {
    //update bookstatus to available
    book.status.available = true;
    book.status.borrower = null;
    await book.save();
    return true;
}

async function returnAllBooksfromMember(memberId) {
    let member = await findById("Member", memberId);
    member = await member.populate("books");
    for (let i = 0; i < member.books.length; i++) {
        await updateBookToAvailable(member.books[i]);
    }
    return true;
}

async function returnBookfromMember(memberId, bookId) {
    //update book in member
    const member = await findById("Member", memberId);
    const book = await findById("Book", bookId);
    if (!member) {
        throw new Error("Member not found");
    }
    if (!book) {
        throw new Error("Book not found");
    }
    const updateMemberDetail = updateMemberBooks(member, bookId);
    if (!updateMemberDetail) {
        throw new Error("Updating member detail failed");
    }
    const updateBookDetail = updateBookToAvailable(book);
    if (!updateBookDetail) {
        throw new Error("Updating book detail failed");
    }
    return true;
}

async function findByIdAndDeleteMember(memberId) {
    try {
        const isDelete = await Member.findByIdAndDelete(memberId);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}

async function findByIdAndDeleteBook(bookId) {
    try {
        const isDelete = await Book.findByIdAndDelete(bookId);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}

async function findByIdAndUpdateBook(bookId, new_book_details) {
    try {
        const updateRes = await Book.findByIdAndUpdate(
            bookId,
            new_book_details,
            { new: true }
        );
        return { success: true, error: "" };
    } catch (err) {
        throw new Error(err);
    }
}

async function deleteBookfromLibrary(bookId) {
    try {
        let book = await findById("Book", bookId);
        if (!book) {
            throw new Error("Book not found !");
        }
        if (book.status.available == false) {
            let borrower_id = book.status.borrower;
            let member = await findById("Member", borrower_id);
            member.books.remove(bookId);
            await member.save();
        }
        await findByIdAndDeleteBook(bookId);
        return { success: true, error: "" };
    } catch (err) {
        throw new Error(err);
    }
}

module.exports = {
    findByUsername,
    findById,
    fetchAllBooks,
    fetchAllMembers,
    borrowBooktoMember,
    returnBookfromMember,
    findByIdAndDeleteMember,
    findByIdAndDeleteBook,
    findByIdAndUpdateBook,
    returnAllBooksfromMember,
    deleteBookfromLibrary,
};
