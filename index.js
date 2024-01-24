const express = require("express");
const cors = require("cors");
const { default: mongoose } = require("mongoose");
const bcrypt = require("bcryptjs");
const UserModel = require("./models/User");
require("dotenv").config();

const bcryptSalt = bcrypt.genSaltSync(8);

const app = express();
app.use(express.json());
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
        res.json("Password is OK");
      } else {
        res.status(422).json("Password is not OK");
      }
    } else {
      res.json("User not found");
    }
  } catch (error) {}
});

app.listen(3000);
