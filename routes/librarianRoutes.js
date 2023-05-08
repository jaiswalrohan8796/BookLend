const router = require("express").Router();
const joi = require("joi");

const db_utils = require("../utils/db_utils.js");
const hashing = require("../utils/hashing.js");
const dataValidation = require("../utils/dataValidation.js");
const auth = require("../utils/auth.js");
const Librarian = require("../models/Librarian.js");
const Book = require("../models/Book.js");

//Unprotected GET Routes

router.get("/signup", (req, res, next) => {
    res.render("librarian/signup", { error: "", status: "" });
});

router.get("/login", (req, res, next) => {
    res.render("librarian/login", { error: "", status: "" });
});

//Unprotected POST Routes

router.post("/signup", async (req, res, next) => {
    try {
        console.log(`Incoming Signup Request`);
        const signup_data = req.body;
        const validate =
            await dataValidation.librarianSchemaValidator.validateAsync(
                signup_data
            );
        let isAlreadyRegistered = await db_utils.findByUsername(
            "Librarian",
            signup_data.username
        );
        if (isAlreadyRegistered) {
            res.render("librarian/signup", {
                error: "Username already registered!!",
                status: "",
            });
            return;
        }
        //hashing password
        signup_data.password = await hashing.hashPassword(signup_data.password);
        const new_librarian = new Librarian(signup_data);
        const isSaved = await new_librarian.save();
        if (isSaved) {
            //success
            res.render("librarian/signup", {
                error: "",
                status: "Success!, Now Login",
            });
        }
    } catch (err) {
        // console.log(err);
        if (err instanceof joi.ValidationError) {
            res.render("librarian/signup", {
                error: err.details[0].message,
                status: "",
            });
        } else {
            res.render("librarian/signup", {
                error: "Server Error",
                status: "",
            });
        }
    }
});

router.post("/login", async (req, res, next) => {
    try {
        console.log(`Incoming Login Request`);
        const login_data = req.body;
        const validate = await dataValidation.loginValidator.validateAsync(
            login_data
        );
        const librarian = await db_utils.findByUsername(
            "Librarian",
            login_data.username
        );
        //check user
        if (!librarian) {
            res.status(401);
            res.render("librarian/login", {
                error: "Username not found !!",
                status: "",
            });
            return;
        }
        //check password
        const passwordMatched = await hashing.comparePassword(
            login_data.password,
            librarian.password
        );
        if (!passwordMatched) {
            res.status(401);
            res.render("librarian/login", {
                error: "Password incorrect !!",
                status: "",
            });
            return;
        }
        //token
        const payload = {
            role: "Librarian",
            id: librarian._id,
        };
        const token = auth.create_jwt_token(payload);
        res.cookie("token", token, { httpOnly: true });
        res.status(200);
        res.redirect("/librarian/app");
    } catch (err) {
        console.log(err);
        if (err instanceof joi.ValidationError) {
            res.render("librarian/login", {
                error: err.details[0].message,
                status: "",
            });
        } else {
            res.render("librarian/login", {
                error: "Server Error",
                status: "",
            });
        }
    }
});

//Protected Routes

router.get("/app", auth.authenticate_librarian, async (req, res, next) => {
    try {
        const librarian = await db_utils.findById("Librarian", req.user_id);
        const members = await db_utils.fetchAllMembers();
        if (!librarian) {
            throw new Error("User Not Found");
        }
        res.render("librarian/app", {
            user: librarian,
            members: members,
            error: "",
            status: "",
        });
    } catch (err) {
        console.log(err);
        res.render("librarian/login", {
            error: err.message,
            status: "",
        });
    }
});

router.get(
    "/app/delete_member/:memberId",
    auth.authenticate_librarian,
    async (req, res, next) => {
        try {
            const memberId = req.params.memberId;
            const member = await db_utils.findById("Member", memberId);
            if (!member) {
                throw new Error("Member not found !");
            }
            let returnAllBooksResponse =
                await db_utils.returnAllBooksfromMember(memberId);
            let deleteResponse = await db_utils.findByIdAndDeleteMember(
                memberId
            );
            const librarian = await db_utils.findById("Librarian", req.user_id);
            const members = await db_utils.fetchAllMembers();
            res.render("librarian/app", {
                user: librarian,
                members: members,
                error: "",
                status: "Member deleted success !",
            });
        } catch (err) {
            console.log(err);
            const librarian = await db_utils.findById("Librarian", req.user_id);
            const members = await db_utils.fetchAllMembers();
            res.render("librarian/app", {
                user: librarian,
                members: members,
                error: err.message,
                status: "",
            });
        }
    }
);

router.get(
    "/app/retrieve_book/:memberId/:bookId",
    auth.authenticate_librarian,
    async (req, res, next) => {
        try {
            const bookId = req.params.bookId;
            const memberId = req.params.memberId;
            const result = await db_utils.returnBookfromMember(
                memberId,
                bookId
            );
            const librarian = await db_utils.findById("Librarian", req.user_id);
            const members = await db_utils.fetchAllMembers();
            res.render("librarian/app", {
                user: librarian,
                members: members,
                error: "",
                status: "Book retrieved !",
            });
        } catch (err) {
            console.log(err);
            const librarian = await db_utils.findById("Librarian", req.user_id);
            const members = await db_utils.fetchAllMembers();
            res.render("librarian/app", {
                user: librarian,
                members: members,
                error: err.message,
                status: "",
            });
        }
    }
);

router.get("/library", auth.authenticate_librarian, async (req, res, next) => {
    try {
        const librarian = await db_utils.findById("Librarian", req.user_id);
        let allBooks = await db_utils.fetchAllBooks();
        if (!librarian) {
            throw new Error("Login is required");
        }
        res.render("librarian/library", {
            user: librarian,
            books: allBooks,
            error: "",
            status: "",
        });
    } catch (err) {
        console.log(err);
        const librarian = await db_utils.findById("Librarian", req.user_id);
        const members = await db_utils.fetchAllMembers();
        res.render("librarian/app", {
            user: librarian,
            members: members,
            error: err.message,
            status: "",
        });
    }
});

router.post(
    "/library/add_book",
    auth.authenticate_librarian,
    async (req, res, next) => {
        try {
            const book_data = req.body;
            const validate =
                await dataValidation.BookSchemaValidator.validateAsync(
                    book_data
                );
            book_data.status = {
                available: true,
                borrower: null,
            };
            let new_book = new Book(book_data);
            const isSaved = await new_book.save();
            if (isSaved) {
                const librarian = await db_utils.findById(
                    "Librarian",
                    req.user_id
                );
                let allBooks = await db_utils.fetchAllBooks();
                res.render("librarian/library", {
                    user: librarian,
                    books: allBooks,
                    error: "",
                    status: "Book added !",
                });
            } else {
                throw new Error("Internal Server Error");
            }
        } catch (err) {
            console.log(err);
            const librarian = await db_utils.findById("Librarian", req.user_id);
            let allBooks = await db_utils.fetchAllBooks();
            if (err instanceof joi.ValidationError) {
                res.render("librarian/library", {
                    user: librarian,
                    books: allBooks,
                    error: err.details[0].message,
                    status: "",
                });
            } else {
                res.render("librarian/library", {
                    user: librarian,
                    books: allBooks,
                    error: err.message,
                    status: "",
                });
            }
        }
    }
);

router.get(
    "/library/delete_book/:bookId",
    auth.authenticate_librarian,
    async (req, res, next) => {
        try {
            const bookId = req.params.bookId;
            const deleteResponse = await db_utils.deleteBookfromLibrary(bookId);
            const librarian = await db_utils.findById("Librarian", req.user_id);
            let allBooks = await db_utils.fetchAllBooks();
            res.render("librarian/library", {
                user: librarian,
                books: allBooks,
                error: "",
                status: "Book deletion sucess",
            });
        } catch (err) {
            console.log(err);
            const librarian = await db_utils.findById("Librarian", req.user_id);
            let allBooks = await db_utils.fetchAllBooks();
            res.render("librarian/library", {
                user: librarian,
                books: allBooks,
                error: err.message,
                status: "",
            });
        }
    }
);
router.post(
    "/library/edit_book/:bookId",
    auth.authenticate_librarian,
    async (req, res, next) => {
        try {
            const book_details = req.body;
            const bookId = req.params.bookId;
            await dataValidation.BookSchemaValidator.validateAsync(
                book_details
            );
            let updateResponse = await db_utils.findByIdAndUpdateBook(
                bookId,
                book_details
            );
            const librarian = await db_utils.findById("Librarian", req.user_id);
            let allBooks = await db_utils.fetchAllBooks();
            res.render("librarian/library", {
                user: librarian,
                books: allBooks,
                error: "",
                status: "Book modified success",
            });
        } catch (err) {
            console.log(err);
            const librarian = await db_utils.findById("Librarian", req.user_id);
            let allBooks = await db_utils.fetchAllBooks();
            if (err instanceof joi.ValidationError) {
                res.render("librarian/library", {
                    user: librarian,
                    books: allBooks,
                    error: err.details[0].message,
                    status: "",
                });
            } else {
                res.render("librarian/library", {
                    user: librarian,
                    books: allBooks,
                    error: err.message,
                    status: "",
                });
            }
        }
    }
);

router.get("/logout", auth.authenticate_librarian, (req, res, next) => {
    res.clearCookie("token");
    res.redirect("/librarian/login");
});

module.exports = router;
