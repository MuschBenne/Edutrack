import { Request, Response } from "express";
import session from "express-session";
import User, { Entry } from "../db_models/User";
import Course from "../db_models/Course";
import { addStudentToCourse } from "./CourseManager";

export async function RenderApp(req: Request, res: Response) {
    if (!req.session["user"]){
        res.status(403).redirect("/login");
        return;
    }
    
    let data = {};

    switch(req.path){
        case "/app/course_registration":
            const pickcourses = await fetchAvailableCourses(req.session["user"]); 
            data = {
                name: req.session["user"] ?? "unknown",
                availableCourses: pickcourses
            };
            res.render("Application/CourseRegister", data);
            break;
        
        case "/app/course_page":
            res.render("Application/CoursePage", data);
            break;

        default:
            const userCourses = await fetchRegisteredCourses(req.session["user"]);
            data = {
                name: req.session["user"] ?? "unknown",
                courses: userCourses
            };
            res.render("Application/Main", data);
    }
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
            // TOCHECK: Se till att kursen anges av användaren i webbläsaren.
            const studySession: Entry = {
                time: Number.parseInt(req.body.time),
                typeOfStudy: req.body.type,
                gradeSess: Number.parseInt(req.body.rating),
                health: Number.parseInt(req.body.health)
            }
			result = await addStudySession(req.session["user"], req.body.courseId, studySession);
			break;
        case "addStudentToCourse":
            result = await addStudentToCourse(req.body.courseId, req.session["user"]);
            break;
        case "fetchCourses":
            result= await fetchAvailableCourses(req.session["user"]);
            break;
		default:
			result = [400, "Invalid action: " + req.query.action];
	}
    res.status(result[0] as number).json({msg: result[1]});
}

async function addStudySession(userName: string, courseID: string, sessionData: Entry): Promise<Array<number | string>> {
    let course = await Course.findOne({courseId: courseID}).exec();
    if(!course)
        return [400, "Course with id [" + courseID + "] was not found in the database."];
    // Try to find user
    let user = await User.findOne({username: userName}).exec();
    if(!user)
        return [400, "Username [" + userName + "] was not found in the database."];
    // This will be the key for the sessions map for a course
    const date = new Date().toDateString().replaceAll(" ", "_");
    
    // Define the path to get to the course's saved dates for saved sessions
    let pathString = "activeCourses." + courseID + ".sessions." + date;

    // Get the sessions at the current date
    if(!user.get(pathString)) // If no sessions have been saved for this date, create the first one
        user.set(pathString, [sessionData]);
    else
        user.activeCourses[courseID]["sessions"][date].push(sessionData); // Add additional session for the date

    // Mark the document as modified and then save it
    user.markModified("activeCourses"); // EXTREMT viktig tydligen omg, många timmar...
    await user.save().then((savedDoc) => {
        console.log(savedDoc.activeCourses[courseID][date]);
    })
    return [200, "User study session added successfully"];
        
}

// TOCHECK: Lägg till en fetchRegisteredCourses funktion som hämtar och returnerar arrayen med alla nuvarande användarens kurser
export async function fetchRegisteredCourses(username: string): Promise<Array<Object>> {
    const foundUser = await User.findOne({ username: username }).exec(); // Use findOne() and await

    if (!foundUser) { //måste returna array 
        console.log("User " + username + "not found");
        return []; // Return a proper response
    }
    const courseList = foundUser.activeCourses ?? {};
    let outList = [];
    for(let course in courseList){
        if(course != "_init")
            outList.push(courseList[course]);
    }
    // Hämta kursinfo för alla kurser utan fälten _id och __v (som annars alltid hänger med)
    // Returnera tom array om dessa kurser inte skulle hittas av någon anledning.
    console.log(outList);
    return outList;
}

// TODO: (1/2) Lägg till en fetchSessions funktion som ger klienten alla sessions vi har sparat ned vid alla datum
// TODO: (2/2) Se till att denna data sparas i cookien, så att vi slipper hämta den massa gånger
//export async function fetchSessions(username:string): Promise <Array<Array<string>>> {
//    const foundUser = await User.findOne({ username: username }).exec();
//    return foundUser.sessions;
//}


// TOCHECK: Lägg till en fetchAvailableCourses som hämtar en lista på alla kurser som finns i databasen,
//       minus de som användaren redan är registrerad på

export async function fetchAvailableCourses(username: string): Promise<Array<object>> {
    const allCourses = await Course.find({}, "-_id -__v").exec(); 
    const registeredCourses = await fetchRegisteredCourses(username);

    
    const registeredCourseIds = registeredCourses.map(course => (course as { courseId: string }).courseId);

    // Filter för att ta bort registerade kurser
    const availableCourses = allCourses.filter(course => !registeredCourseIds.includes(course.courseId));

    return availableCourses;
}
