//require
const express = require("express");
const path = require("path");
const http = require("http");
const ejs = require("ejs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser")

// module imports
const homeRoutes = require("./routes/HomeRoutes.js");
const librarianRoutes = require("./routes/librarianRoutes.js");
const memberRoutes = require("./routes/memberRoutes.js");

//config
dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser())
app.set("view engine", "ejs");
app.set("views", "views");

app.use(homeRoutes);
app.use("/librarian", librarianRoutes);
app.use("/member", memberRoutes);

app.listen(PORT, () => {
    console.log(`Listening on PORT : ${PORT}`);
    mongoose
        .connect(process.env.mongoDBURI, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        })
        .then(() => {
            console.log(`Connected to MongoDB`);
        })
        .catch((err) => {
            console.log(err);
            process.exit(1);
        });
});
