const express = require("express");
const cors = require("cors");
const { default: mongoose } = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("./models/User");
const cookieParser = require("cookie-parser");
const imageDownloader = require("image-downloader");
require("dotenv").config();

const bcryptSalt = bcrypt.genSaltSync(8);
const jwtSecret = process.env.SECRET_JWT;
const port = process.env.PORT;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:5173",
  })
);

mongoose.connect(process.env.MONGO_URL);

app.get("/test", (req, res) => {
  res.json("test ok !");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await UserModel.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(user);
  } catch (error) {
    res.status(422).json(error);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email });
    if (user) {
      const isPasswordOk = bcrypt.compareSync(password, user.password);
      if (isPasswordOk) {
        jwt.sign(
          { email: user.email, id: user._id },
          jwtSecret,
          {},
          (err, token) => {
            if (err) throw err;
            res.cookie("token", token).json(user);
          }
        );
      } else {
        res.status(422).json("Password is not OK");
      }
    } else {
      res.json("User not found");
    }
  } catch (error) {}
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userInfo) => {
      if (err) throw err;
      const { name, email, _id } = await UserModel.findById(userInfo.id);
      res.json({ name, email, _id });
    });
  } else {
    res.json(null);
  }
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json(true);
});

app.post("/upload-by-link", async (req, res) => {
  const { link } = req.body;
  const newName = "photo" + Date.now() + ".jpg";
  const destination = __dirname + "/uploads/" + newName;
  await imageDownloader.image({
    url: link,
    dest: destination,
  });
  res.json(newName);
});

app.listen(port, () => {
  console.log(`Server listening port on ${port}`);
});
