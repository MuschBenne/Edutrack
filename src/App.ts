import express from 'express';
import mongoose from 'mongoose';
import User from './db_models/User';

mongoose.connect("mongodb://127.0.0.1:27017")
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

/**
 * Register benji as user
 */
app.get("/register", async (req, res) => {
  const newUser = new User({
    username: "Benji"
  });

  await newUser.save().then(() => {
    if(User.findById({username: "Benji"}))
      res.send("Name already registered");
    else
      res.send("Success!");
  })
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}\nUse Ctrl + C to stop the server...`);
});
