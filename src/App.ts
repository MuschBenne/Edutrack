import express from 'express';
import mongoose from 'mongoose';

mongoose.connect("mongodb://127.0.0.1:27017")
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}\nUse Ctrl + C to stop the server...`);
});
