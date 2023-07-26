const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cloudinaryLib = require("./lib/cloudinary_CDN_lib");
const cors = require("cors");

require('dotenv').config();

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const postsRouter = require("./routes/posts");
const mongoLib = require("./lib/mongoDBLib");
const feedRouter = require("./routes/feed");
const loginRouter = require('./routes/login');
const signupRouter = require('./routes/signup');

// const { authenticate } = require('./authentication/authenticate');

mongoLib.connectToMongo().then(() => { });

const app = express();
cloudinaryLib.configCloudinary();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use("/", indexRouter);
// app.use("/upload", async (req, res, next) => {
//   const result = await cloudinaryLib.uploadImage("img.png");
//   res.send({ imgId: result });
// });
app.use("/login",loginRouter);
app.use("/signup",signupRouter);
app.use("/users", usersRouter);
app.use("/posts", postsRouter);
app.use("/feed", feedRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json(err);
});

module.exports = app;
