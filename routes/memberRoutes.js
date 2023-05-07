const router = require("express").Router();
const joi = require("joi");

const db_utils = require("../utils/db_utils.js");
const hashing = require("../utils/hashing.js");
const dataValidation = require("../utils/dataValidation.js");
const auth = require("../utils/auth.js");
const Member = require("../models/Member.js");

//Unprotected GET Routes

router.get("/signup", (req, res, next) => {
    res.render("member/signup", { error: "", status: "" });
});

router.get("/login", (req, res, next) => {
    res.render("member/login", { error: "", status: "" });
});

//Unprotected POST Routes

router.post("/signup", async (req, res, next) => {
    try {
        console.log(`Incoming Signup Request`);
        const signup_data = req.body;
        const validate =
            await dataValidation.memberSchemaValidator.validateAsync(
                signup_data
            );
        let isAlreadyRegistered = await db_utils.findByUsername(
            "Member",
            signup_data.username
        );
        if (isAlreadyRegistered) {
            res.render("member/signup", {
                error: "Username already registered!!",
                status: "",
            });
            return;
        }
        //hashing passowrd
        signup_data.password = await hashing.hashPassword(signup_data.password);
        const new_member = new Member(signup_data);
        const isSaved = await new_member.save();
        if (isSaved) {
            //success
            res.render("member/signup", {
                error: "",
                status: "Success!, Now Login",
            });
        }
    } catch (err) {
        if (err instanceof joi.ValidationError) {
            res.render("member/signup", {
                error: err.details[0].message,
                status: "",
            });
        } else {
            console.log(err);
            res.render("member/signup", {
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
        const member = await db_utils.findByUsername(
            "Member",
            login_data.username
        );
        //check user
        if (!member) {
            res.render("member/login", {
                error: "Username not found !!",
                status: "",
            });
            return;
        }
        //check password
        const passwordMatched = await hashing.comparePassword(
            login_data.password,
            member.password
        );
        if (!passwordMatched) {
            res.render("member/login", {
                error: "Password incorrect !!",
                status: "",
            });
            return;
        }
        //token
        const payload = {
            role: "Member",
            id: member._id,
        };
        const token = auth.create_jwt_token(payload);
        res.cookie("token", token, { httpOnly: true });
        res.status(200);
        res.redirect("/member/app");
    } catch (err) {
        console.log(err);
        if (err instanceof joi.ValidationError) {
            res.render("member/login", {
                error: err.details[0].message,
                status: "",
            });
        } else {
            res.render("member/login", {
                error: "Server Error",
                status: "",
            });
        }
    }
});

//Protected Routes

router.get("/app", auth.authenticate_member, async (req, res, next) => {
    let member = await db_utils.findById("Member", req.user_id);
    if (!member) {
        res.render("member/login", {
            error: "Login required !!",
            status: "",
        });
        return;
    }
    member = await member.populate("books");
    res.render("member/app", { user: member, error: "", status: "" });
});

router.get("/library", auth.authenticate_member, async (req, res, next) => {
    const member = await db_utils.findById("Member", req.user_id);
    const books = await db_utils.fetchAllBooks();
    if (!member) {
        res.render("member/login", {
            error: "Login required !!",
            status: "",
        });
        return;
    }
    res.render("member/library", {
        user: member,
        error: "",
        books: books,
        status: "",
    });
});

router.get(
    "/app/return/:bookId",
    auth.authenticate_member,
    async (req, res, next) => {
        const bookId = req.params.bookId;
        const memberId = req.user_id;
        try {
            const returnAction = await db_utils.returnBookfromMember(
                memberId,
                bookId
            );
            if (!returnAction.success) {
                let member = await db_utils.findById("Member", memberId);
                member = await member.populate("books");
                res.render("member/app", {
                    user: member,
                    error: returnAction.error,
                    status: "",
                });
            } else {
                let member = await db_utils.findById("Member", memberId);
                member = await member.populate("books");
                res.render("member/app", {
                    user: member,
                    error: "",
                    status: "Book return success !",
                });
            }
        } catch (err) {
            console.log(err);
            let member = await db_utils.findById("Member", memberId);
            member = await member.populate("books");
            res.render("member/app", {
                user: member,
                error: "Internal Server Error",
                status: "",
            });
        }
    }
);

router.get(
    "/library/borrow/:bookId",
    auth.authenticate_member,
    async (req, res, next) => {
        const bookId = req.params.bookId;
        const memberId = req.user_id;
        const borrowAction = await db_utils.borrowBooktoMember(
            memberId,
            bookId
        );
        if (!borrowAction.success) {
            const allBooks = await db_utils.fetchAllBooks();
            const member = await db_utils.findById("Member", req.user_id);
            res.render("member/library", {
                user: member,
                error: borrowAction.error,
                books: allBooks,
                status: "",
            });
        }
        const allBooks = await db_utils.fetchAllBooks();
        const member = await db_utils.findById("Member", req.user_id);
        res.render("member/library", {
            user: member,
            error: "",
            books: allBooks,
            status: "Book borrow success !",
        });
    }
);

router.get("/logout", auth.authenticate_member, (req, res, next) => {
    res.clearCookie("token");
    res.redirect("/member/login");
});

router.get(
    "/delete_account",
    auth.authenticate_member,
    async (req, res, next) => {
        try {
            const memberId = req.user_id;
            let returnAllBooksResponse =
                await db_utils.returnAllBooksfromMember(memberId);
            let deleteResponse = await db_utils.findByIdAndDeleteMember(
                memberId
            );
            if (deleteResponse) {
                res.redirect("/member/login");
            }
        } catch (err) {
            console.log(err);
            res.redirect("/member/app");
        }
    }
);

module.exports = router;
