import express, { Request, Response } from 'express';
import session from "express-session";
import mongoose from 'mongoose';
import { HandleRegister } from './modules/Register';
import { HandleLogin } from './modules/Login';
import { HandleLanding } from './modules/Landing';
import { HandleLogout } from './modules/Logout';
import { HandleApp } from './modules/Application';
import path from "path";
import { addCourse, addStudent, removeCourse } from './modules/CourseManager';

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

app.use(session({
	secret: 'BJB-AB-Forever',
	resave: false,
	saveUninitialized: true,
	cookie: {}
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
	const data = {
		name: "Jakob"
	}
	res.render("Application", data);
});

app.post("/app", async (req, res) => {
	HandleApp(req, res);
});

/**
 * Course manager
 * 
 * TODO: Lägg till väg för att ta bort kurs
 * TODO: Lägg till väg för att lägga till/ta bort användarnamn till kurser
 * TODO: Läs av query för att bestämma vad som skall göras, vi kan ha en parameter som heter "action"
 * 		 så en url ser ut som:
 * 		 localhost:3000/courseManager?action=addCourse&name=PKD&courseId=11111
 * TODO: [Långt fram], se till att användaren vars session är aktiv och som anropar dessa actions är admin
 */
app.get("/courseManager", async (req, res) => {
	console.log(req.query);
	// Exempel: if(req.query.action === "addCourse") { ... } else if(req.query.action === "removeCourse") osv.
	// Vi använder res.sendStatus för att skicka ett svar med en statuskod. Koden returneras från addCourse
	// baserat på huruvida funktionen kunde genomföras
	if(req.query.action === "addCourse"){
		res.sendStatus(await addCourse(req.query.name as string, req.query.courseId as string));
	}
	else if(req.query.action === "addStudent"){
		res.sendStatus(await addStudent(req.query.courseId as string, req.query.username as string))
	}
	// else if(req.query.action === "removeStudent"){
	// 	res.sendStatus(await removeStudent(req.query.courseId as string, req.query.username as string))
	// }
	else if(req.query.action === "removeCourse"){
		res.sendStatus(await removeCourse(req.query.courseId as string)) //TOCHECK
	}
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
