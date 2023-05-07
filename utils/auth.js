const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

function create_jwt_token(payload) {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY,
    });
    return token;
}

function verify_jwt_token(token) {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return user;
}

const authenticate_librarian = async function (req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        res.status(401);
        res.render("librarian/login", { error: "Login Required", status: "" });
        return;
    }
    try {
        const user = verify_jwt_token(token);
        if (user.role !== "Librarian") {
            res.status(401);
            res.render("librarian/login", {
                error: "Login Required",
                status: "",
            });
            return;
        }
        req.user_id = user.id;
        req.user_role = user.role;
        next();
    } catch (err) {
        console.log(err);
        res.status(401);
        res.render("librarian/login", { error: "Login Required", status: "" });
        return;
    }
};

const authenticate_member = async function (req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        res.status(401);
        res.render("member/login", { error: "Login Required", status: "" });
        return;
    }
    try {
        const user = verify_jwt_token(token);
        if (user.role !== "Member") {
            res.status(401);
            res.render("member/login", {
                error: "Login Required",
                status: "",
            });
            return;
        }
        req.user_id = user.id;
        req.user_role = user.role;
        next();
    } catch (err) {
        console.log(err);
        res.status(401);
        res.render("member/login", { error: "Login Required", status: "" });
        return;
    }
};

module.exports = {
    create_jwt_token,
    verify_jwt_token,
    authenticate_librarian,
    authenticate_member,
};
