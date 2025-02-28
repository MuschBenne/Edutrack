import { Request, Response } from "express";
import session from "express-session";
import User, { Entry } from "../db_models/User";
import Course from "../db_models/Course";
import { addStudentToCourse } from "./CourseManager";
import { ResponseArray } from "../App";

export async function RenderApp(req: Request, res: Response) {
    if (!req.session["user"]){
        res.status(403).redirect("/login");
        return;
    }
    
    let data = {}; // Data to pass to the EJS renderer

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
            data = {
                courseData: JSON.stringify(await fetchUserCourseData(req.session["user"], req.query.course as string)),
                courses: await fetchRegisteredCourses(req.session["user"])
            }
            console.log(data);
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

    let result = [];
    switch(req.query.action){
        case "addStudySession":
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
            result = await fetchAvailableCourses(req.session["user"]);
            break;
        
		default:
			result = [400, "Invalid action: " + req.query.action];
	}
    res.status(result[0] as number).json({message: result[1], data: result[2]});
}

/**
 * Save a study session entry to a specified User and Course.
 * @param userName The user to add the session for
 * @param courseID The course to add the session for
 * @param sessionData The data to save to the User document
 * @returns ResponseArray
 */
async function addStudySession(userName: string, courseID: string, sessionData: Entry): Promise<ResponseArray> {
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

/**
 * Fetches an array of CourseData objects for all courses that a user is registered to.
 * @param username: string - the user to fetch this data for
 * @returns Promise resolving to an array of objects containing a User's saved coursedata
 */
export async function fetchRegisteredCourses(username: string): Promise<Array<Object>> {
    const foundUser = await User.findOne({ username: username }).exec(); // Use findOne() and await

    if (!foundUser) { //måste returna array 
        console.log("User " + username + "not found");
        return []; // Return a proper response
    }
    const courseList = foundUser.activeCourses ?? {};
    let outList = Object.values(courseList);
    console.log(outList);
    return outList;
}

/**
 * Fetches an object containing course sessions for this user and specific course.
 * @param username: string - the user to fetch this data for
 * @param courseId: string - the course ID to fetch the course data for
 * @returns: SessionData for this course
 */
async function fetchStudySessions(username: string, courseId:string): Promise<Object> {
    const foundUser = await User.findOne({ username: username }).exec(); // Use findOne() and await
    if(!foundUser){
        return;
    }
    if(!foundUser.activeCourses[courseId]){
        return
    }
    return foundUser.activeCourses[courseId]["sessions"];
}

/**
 * Fetches a CourseData object containing name, id, and course sessions for this user.
 * @param username: string - the user to fetch this data for
 * @param courseId: string - the course ID to fetch the course data for
 * @returns: UserCourseData for this course
 */
async function fetchUserCourseData(username: string, courseId:string): Promise<Object> {
    const foundUser = await User.findOne({ username: username }).exec(); // Use findOne() and await
    if(!foundUser){
        return;
    }
    if(!foundUser.activeCourses[courseId]){
        return
    }
    return foundUser.activeCourses[courseId];
}

/**
 * Fetches an array of Course documents that a user is eligible to register for.
 * A user is not eligible for a course of it has already registered for it.
 * @param username: string - the user to fetch this data for
 * @returns: A promise that resolves to an array of Course documents not already registered for.
 */
export async function fetchAvailableCourses(username: string): Promise<Array<object>> {
    const allCourses = await Course.find({}, "-_id -__v").exec(); 
    const registeredCourses = await fetchRegisteredCourses(username);
    
    // Behåll bara IDs för registered courses så dessa kan jämföras i nedanstående filter
    const registeredCourseIds = registeredCourses.map(course => (course as { courseId: string }).courseId);

    // Filter för att ta bort registerade kurser
    const availableCourses = allCourses.filter(course => !registeredCourseIds.includes(course.courseId));

    return availableCourses;
}