const joi = require("joi");

const loginValidator = joi.object({
    username: joi.string().required(),
    password: joi.string().required(),
});

const librarianSchemaValidator = joi.object({
    name: joi.string().required(),
    username: joi.string().email().required(),
    password: joi.string().required(),
});

const memberSchemaValidator = joi.object({
    name: joi.string().required(),
    username: joi.string().email().required(),
    password: joi.string().required(),
});

const BookSchemaValidator = joi.object({
    title: joi.string().required(),
    author: joi.string().required(),
    desc: joi.string(),
    img: joi.string(),
    status: joi.object({
        available: joi.bool(),
        borrower: joi.string(),
    }),
});

module.exports = {
    librarianSchemaValidator,
    memberSchemaValidator,
    BookSchemaValidator,
    loginValidator,
};
