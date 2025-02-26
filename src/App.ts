import express, { Request, Response } from 'express';
import session from "express-session";
import mongoose from 'mongoose';
import { HandleRegister } from './modules/Register';
import { HandleLogin } from './modules/Login';
import { HandleLanding } from './modules/Landing';
import { HandleLogout } from './modules/Logout';
import { HandleApp, RenderApp } from './modules/Application';
import path from "path";
import { HandleCourseManager } from './modules/CourseManager';

const port = 3000;
const app = express();


const options = {
    root: path.join(__dirname)
};

// Connecta till databasen
mongoose.connect("mongodb://127.0.0.1:27017")

// Express middleware:
// Parsea JSON kroppen av requests direkt
app.use(express.json());

const MongoStore = require("connect-mongo");

app.use(session({
	secret: 'BJB-AB-Forever',
	resave: false,
	saveUninitialized: false,
	store: MongoStore.create({
		mongoUrl: "mongodb://127.0.0.1:27017/session-store"
	}),
	cookie: {httpOnly: true}
}));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/**
 * Landing page
 */
app.get('/', (req: Request, res: Response) => {
	HandleLanding(req, res);
});

/**
 * Handle register GET 
 */
app.get("/register",  (req, res) => {
	res.render("Register");
});

/**
 * Handle register POST request (Actual register action)
 */
app.post("/register", async (req, res) => {
	HandleRegister(req, res);
})

/**
 * Handle login route GET (Display website)
 */
app.get("/login", async (req, res) => {
	res.render("Login");
});

/**
 * Handle login route POST (Actual login action)
 */
app.post("/login", async (req, res) => {
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

// TODO: Använd paketet "express-session" för att se till att en inloggad användare hålls inloggad

// TODO: Se till att en session är igång, annars får inte en användare vara på denna sidan ens.
app.get("/app", async (req, res) => {
	RenderApp(req, res);
});

app.post("/app", async (req, res) => {
	HandleApp(req, res);
});

/**
 * Course manager
 * TODO: Läs av query för att bestämma vad som skall göras, vi kan ha en parameter som heter "action"
 * 		 så en url ser ut som:
 * 		 localhost:3000/courseManager?action=addCourse&name=PKD&courseId=11111
 * TODO: [Långt fram], se till att användaren vars session är aktiv och som anropar dessa actions är admin
 */
app.get("/courseManager", async (req, res) => {
	HandleCourseManager(req, res);
});


/**
 * Master css file
 */

app.get("/master.css", (req, res) => {
  
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
