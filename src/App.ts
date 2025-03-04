import express, { Request, Response } from 'express';
import session from "express-session";
import mongoose from 'mongoose';
import Course from './db_models/Course';
import { HandleRegister, RenderRegister } from './modules/Register';
import { HandleLogin, RenderLogin } from './modules/Login';
import { HandleLogout } from './modules/Logout';
import { HandleApp, RenderApp } from './modules/Application';
import path from "path";
import { HandleCourseManager } from './modules/CourseManager';
import User from './db_models/User';

/**
 * Type ResponseArray: [statusCode: number, message: string, data (optional): object]
 */
export type ResponseArray = [number, string, object?]

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
	unset: 'destroy',
	store: MongoStore.create({
		mongoUrl: "mongodb://127.0.0.1:27017/session-store"
	}),
	cookie: {httpOnly: true}
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname + '/public'));

/**
 * Landing page
 */
app.get('/', (req: Request, res: Response) => {
	res.render("Landing");
});

/**
 * Handle register GET 
 */
app.get("/register", (req, res, next) => {
	RenderRegister(req, res, next)
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
	RenderLogin(req, res);
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
app.get("/logout", async (req, res, next) => {
	HandleLogout(req, res, next);
});

/**
 * Handle app
 */

app.get(["app/", "/app*"], async (req, res) => {
	RenderApp(req, res);
});

app.post("/app", async (req, res) => {
	HandleApp(req, res);
});

/**
 * Course manager
 */
app.post("/courseManager", async (req, res) => {
	HandleCourseManager(req, res);
});

/**
 * Admin panel
 */
app.get("/admin", async (req, res) => {
	//TOCHECK: Se till att endast sessions med propertyn isAdmin får nå res.render("Admin")
	if (req.session["isAdmin"]) {
		const allCourses = await Course.find({}, "-_id -__v").exec();
		const allUsers = await User.find({}, "-__v").exec();
		let data = {
			courses: allCourses,
			users: allUsers
		}
		res.render("Admin", data);
	} else {
		res.status(403).send("Access denied, admins only!");
	}
});

app.listen(port, () => {
	return console.log(`Express is listening at http://localhost:${port}\nUse Ctrl + C to stop the server...`);
});
