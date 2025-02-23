import { Request, Response } from "express";
import session from "express-session";
import User, { Entry } from "../db_models/User";

export async function HandleApp(req: Request, res: Response){
    switch(req.query.action){
        case "addStudySession":
            // TODO: Se till att användaren bestäms av express session
            // TODO: Se till att kursen anges av användaren i webbläsaren.
            const studySession: Entry = {
                time: Number.parseInt(req.body.time),
                typeOfStudy: req.body.type,
                gradeSess: Number.parseInt(req.body.rating),
                health: Number.parseInt(req.body.health)
            }
			const result = await addStudySession("Jakob", "PKD", studySession);
            res.status(result[0] as number).json({msg: result[1]});
			break;
		default:
			res.status(400).json({msg: "Invalid action: " + req.query.action})
	}
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

// TODO: Lägg till en registerToCourse funktion som registrerar en användare till en kurs (och en kurs till en användare)
async function registerToCourse() {
    return;
}
// TODO: Lägg till en fetchRegisteredCourses funktion som hämtar och returnerar arrayen med alla nuvarande användarens kurser
async function fetchRegisteredCourses() {
    return;
}

//TODO: Lägg till en fetchSessions funktion som ger klienten alla sessions vi har sparat ned vid alla datum
async function fetchSessions() {
    return;
}