import express from 'express';
import mongoose from 'mongoose';
import User from './db_models/User';
import { HandleRegister } from './modules/Register';
import { HandleLogin } from './modules/Login';
import { HandleLanding } from './modules/Landing';
import { HandleLogout } from './modules/Logout';
import { HandleApp } from './modules/Application';
import path from "path";
import { addCourse } from './modules/courseManager';
import { stringify } from 'querystring';

mongoose.connect("mongodb://127.0.0.1:27017")
const app = express();
app.use(express.json());
const port = 3000;

/**
 * Landing page
 */
app.get('/', (req, res) => {
  HandleLanding(req, res);
});

/**
 * Handle register
 */
app.get("/register",  (req, res) => {
  const options = {
    root: path.join(__dirname)
};
  res.sendFile("./views/Register.html", options, (err: Error) => {
    if(err === undefined){
      console.log(res.statusCode);
      
    }
    else {
      console.error(err.message);
    }
  });
});

app.post("/register", async (req, res) => {
  HandleRegister(req, res);
})

/**
 * Handle login
 */
app.get("/login", async (req, res) => {
  HandleLogin(req, res);
});

/**
 * Handle logout
 */
app.get("/logout", async (req, res) => {
  HandleLogout(req, res);
});

/**
 * Handle app
 */
app.get("/app", async (req, res) => {
  HandleApp(req, res);
});

/**
 * Course manager
 * 
 * TODO: Lägg till väg för att ta bort kurs
 * TODO: Lägg till väg för att lägga till/ta bort användarnamn till kurser
 */
app.get("/registerCourse", (req, res) => {
  console.log(req.query);
  addCourse (req.query.name as string ,req.query.courseId as string)
});


/**
 * Master css file
 */

app.get("/master.css", (req, res) => {
  const options = {
    root: path.join(__dirname)
  };
  res.sendFile("./views/master.css", options, (err: Error) => {
    if(err === undefined){
      console.log(res.statusCode);
      
    }
    else {
      console.error(err.message);
    }
  });
})

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}\nUse Ctrl + C to stop the server...`);
});
