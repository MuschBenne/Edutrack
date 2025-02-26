import { Request, Response } from "express";
import session from "express-session";
import User, { Entry } from "../db_models/User";

export async function RenderApp(req: Request, res: Response) {
    if (!req.session["user"]){
        res.status(403).redirect("/login");
        return;
    }
    const data = {
        name: req.session["user"] ?? "unknown",
        courses: []
    }
    res.render("Application/Main", data);
}

export async function HandleApp(req: Request, res: Response) {
    // Se till att en användare är inloggad, annars skicka till login-skärmen
    if (!req.session["user"])
        res.status(403).redirect("/login");

    // Resultat-arrayn har strukturen
    // result[0]: Number = statuskod
    // result[1]: String = meddelande till klienten
    //
    // Därav bör alla funktioner som anropas av requestet returnera en Promise<Array<number | string>>.
    // Promise eftersom att funktionerna är async.
    // (Se https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise för mer info).

    // TODO: Se till att returvärden på funktioner som anropas är Promise<Array<number | string>>
    let result = [];
    switch(req.query.action){
        //TODO: Lägg till switch cases för resten av funktionerna i denna fil.
        case "addStudySession":
            // TODO: Se till att kursen anges av användaren i webbläsaren.
            const studySession: Entry = {
                time: Number.parseInt(req.body.time),
                typeOfStudy: req.body.type,
                gradeSess: Number.parseInt(req.body.rating),
                health: Number.parseInt(req.body.health)
            }
			result = await addStudySession(req.session["user"], "PKD", studySession);
			break;
		default:
			result = [400, "Invalid action: " + req.query.action];
	}
    res.status(result[0] as number).json({msg: result[1]});
}

async function addStudySession(userName: string, courseID: string, sessionData: Entry): Promise<Array<number | string>> {
    // Try to find user
    let user = await User.findOne({username: userName});
    if(!user)
        return [400, "Username was not found in the database."];
    // This will be the key for the sessions map for a course
    const date = new Date().toDateString().replaceAll(" ", "_");
    
    // Define the path to get to the course's saved dates for saved sessions
    let pathString = "sessions." + courseID;
    // If no course sessions have been made for this course, despite the user being registered to it...
    if(!user.get(pathString) && user.activeCourses.includes(courseID))
        // Create the empty object for this course
        user.set(pathString, {});
    
    // Update the path to get to the current date's sessions
    pathString += "." + date;
    // Get the sessions at the current date
    if(!user.get(pathString)) // If no sessions have been saved for this date, create the first one
        user.set(pathString, [sessionData]);
    else
        user.sessions[courseID][date].push(sessionData); // Add additional session for the date

    // Mark the document as modified and then save it
    user.markModified("sessions"); // EXTREMT viktig tydligen omg, många timmar...
    await user.save().then((savedDoc) => {
        console.log(savedDoc.sessions[courseID][date]);
    })
    return [200, "User study session added successfully"];
        
}

// TODO: Lägg till en fetchRegisteredCourses funktion som hämtar och returnerar arrayen med alla nuvarande användarens kurser
export async function fetchRegisteredCourses(username: string): Promise<Array<string>> {
    const foundUser = await User.findOne({ username: username }).exec(); // Use findOne() and await

    // if (!foundUser) { //måste returna array 
    //     console.log("User not found");
    //     return { status: 400, message: "User not found" }; // Return a proper response
    // }

    return foundUser.activeCourses; // Now correctly accessing the property
}

// TODO: (1/2) Lägg till en fetchSessions funktion som ger klienten alla sessions vi har sparat ned vid alla datum
// TODO: (2/2) Se till att denna data sparas i cookien, så att vi slipper hämta den massa gånger
export async function fetchSessions(username:string): Promise <Array<Array<string>>> {
    const foundUser = await User.findOne({ username: username }).exec();
    return foundUser.sessions;
}

// TODO: Lägg till en fetchAvailableCourses som hämtar en lista på alla kurser som finns i databasen,
//       minus de som användaren redan är registrerad på
async function fetchAvailableCourses() {
    return;
}