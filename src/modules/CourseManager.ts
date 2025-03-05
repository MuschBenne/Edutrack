import Course from "../db_models/Course";
import express, { Request, Response } from 'express';
import User from "../db_models/User";
import { fetchRegisteredCourses } from "./Application";
import { ResponseArray } from "../App";

/**
 * Router function for POST-requests to the path /courseManager
 * @param req The Express request object
 * @param res The Express response object
 */
export async function HandleCourseManager(req: Request, res: Response) {
    let result = [];

    // Check if the user is an admin only once before the switch
    if (!req.session["isAdmin"]) {
        return res.status(400).json({ message: "Access denied, admins only!" });
    }

    // If the user is an admin, proceed with the switch
    switch (req.query.action) {
        case "addCourse":
            result = await addCourse(req.query.name as string, req.query.courseId as string);
            break;
        case "removeCourse":
            result = await removeCourse(req.query.courseId as string);
            break;
        case "deleteUser":
            result = await deleteUser(req.query.username as string);
            break;
        case "removeStudentFromCourse":
            result = await removeStudentFromCourse(req.query.courseID as string, req.query.username as string);
            break;
        default:
            result = [404, "CourseManager: Action [" + req.query.action + "] not found."];
    }

    res.status(result[0]).json({ message: result[1], data: result[2] });
}

/**
 * Add a course to the list of public courses, of which eligible users can elect to register to.
 * @param name Student username
 * @param courseId Course identifier
 * @returns A promise, resolving into a ResponseArray.
 */
async function addCourse(name: string, courseId: string): Promise<ResponseArray>{
    const newCourse = new Course({
        courseId:courseId,
        name:name,
        students:[]
    })
    console.log(name,courseId);

    const foundCourseID = await Course.findOne({courseId: courseId}).exec();

    if (!foundCourseID) {
            return await newCourse.save().then(() => {
                console.log("course added");
                return [200, "Course added"];
            });
    }
    else {
        return [400, "Course with this ID already exists"];
    }
}

/**
 * Remove a course from the list of public courses.
 * @param courseId Course identifier
 * @returns A promise, resolving into a ResponseArray containing a status code and a message
 */
async function removeCourse(courseId: string): Promise<ResponseArray> {
    const foundCourse = await Course.findOne({ courseId: courseId }).exec();

    if (!foundCourse) {
        console.log("Course not found.");
        return [404, "Course not found."];
    }

    await Course.deleteOne({ courseId: courseId });
    console.log("Course with ID " + courseId + " removed.");
    return [200, "Course with ID " + courseId + " removed."]
}
/**
 * Removes a student from a course
 * @param courseId Course identifier
 * @param username User identifier
 * @returns A promise, resolving into a ResponseArray containing a status code and a message
 */
async function removeStudentFromCourse(courseId: string, username: string): Promise<ResponseArray>{
    try {
        const foundCourse = await Course.find({courseId:courseId}).exec();
        if (!foundCourse)
            console.log(`No course found with ID: ${courseId}`);

        const updatedCourse = await Course.updateOne(
            { courseId },
            { $pull: { students: username } } 
        );

        if (updatedCourse.modifiedCount > 0) {
            console.log("Student " + username + " removed from course " + courseId);
            return [200, "Student " + username + " removed from course " + courseId];
        } else {
            console.log("Student " + username + " not found in course " + courseId);
            return [400, "Student " + username + " not found in course " + courseId];
        }
    } catch (error) {
        console.error("Error removing student:", error);
        return [500, "Error removing student: " + error];
    }
}

/**
 * Gets the coursename from the same course ID
 * @param courseId Course identifier
 * @returns the given course name
 */
async function getCourseNameFromId(courseId: string): Promise<string> {
    const foundCourse = await Course.findOne({courseId:courseId}).exec();
    if(!foundCourse)
        return "";
    else
        return foundCourse.name;
}


/**
 * Adds a existing student to a course
 * @param courseId Course identifier
 * @param username User identifier
 * @returns A promise, resolving into a ResponseArray containing a status code and a message
 */
export async function addStudentToCourse(courseId:string, username: string): Promise<ResponseArray>{

    const foundCourse = await Course.findOne({courseId:courseId}).exec();
    const foundUser = await User.findOne({username:username}).exec();

    if(foundCourse && foundUser) {
        //lägg till i course arrayen
        Course.updateOne(
            {courseId:courseId},
            {$addToSet: {students:username}}

        ).exec();
        //uppdatera students active course
        if(!foundUser.activeCourses)
            foundUser.activeCourses = {};
            foundUser.activeCourses[courseId] = {courseId: courseId, name: await getCourseNameFromId(courseId), sessions: null};
            foundUser.markModified("activeCourses");
            foundUser.save();
            return [200, "Student added to course " + courseId];
    }
    else {
        console.log("student eller course finns inte");
        return [400, "Action 'addStudentToCourse' failed: Invalid student " + username + " or course " + courseId];
    }
}


/**
 * Deletes a user from all courses and database
 * @param username User identifier
 * @returns A promise, resolving into a ResponseArray containing a status code and a message
 */
export async function deleteUser(username:string): Promise<ResponseArray> {
    const foundUser = await User.findOne({username:username}).exec();
    if(!foundUser) {
        console.log("Action deleteUser failed: User not found");
        return [400, "Action deleteUser failed: User not found"];
    }
    else{
        const activeCourses = await fetchRegisteredCourses(username)

        for(let i=0; i > activeCourses.length; i++){
            await removeStudentFromCourse(activeCourses[i]["courseId"],username);
        }

        const deletedUser = await User.deleteOne({ username });
            if (deletedUser.deletedCount > 0) {
                console.log(`Student ${username} removed from Users`);
                return [200, `Student ${username} removed from Users`];
            }   

    }
}

// TODO: Statistik: Skriv en funktion fetchAllCourseSessionData som hämtar ett objekt
//                  med alla användares sparade sessioner vid alla datum för denna kurs. Se til att datumen överlappar.
//                  Alltså, om user1 har en array med två sessioner sparade för Feb_10_2024, 
//                  och user2 har en array med två sessioner sparade för samma datum, kommer
//                  det resulterande objektet ha fyra sessioner sparade för det datumet.

/**
 * Fetches all session data from all courses and users
 * @param courseId Course identifier
 * @returns A promise, resolving into a ResponseArray containing a status code and all the data
 */
async function fetchAllCourseSessionData(courseId: string): Promise<ResponseArray>{
    const foundCourseID = await Course.findOne({courseId: courseId}).exec();
    if(!foundCourseID){
        return [400, "No course with ID " + courseId + " found."];
    }
    let students= foundCourseID.students;
    if(students.length==0){
        return [400, "No students registered on" + courseId + " found."];
    }

    let allSessions: { [date: string]: any[] } = {};
    for(let i=0;i<students.length;i++){
        const foundUser = await User.findOne({ username: students[i] }).exec(); // Use findOne() and await
        
        
        if (!foundUser) { //måste returna array 
            console.log("User " + students[i] + "not found");
            continue;
        }
        const sessions = foundUser.activeCourses[courseId] || [];
        for (const session of sessions) {
            const sessionDate = session.date;
            if (!allSessions[sessionDate]) {
                allSessions[sessionDate] = [];
            }
            allSessions[sessionDate].push(session);
        }
        }
    
        return [200,courseId, allSessions];
    }


// TODO: Statistik: Skriv olika funktioner som tar emot datan som fetchAllCourseSessionData ger
//                  och räknar ut lite olika medelvärden osv. Fundera själva på vad ni vill ha för värden.

//ex på functioner
//time spent over the whole period

/**
 * Gives the average time spent on a course for all students
 * @param responeArray with all the data from all the sessions
 * @returns A promise, that gives back a number
 */
async function averageTimeSpentOnCourse(responseArray:ResponseArray): Promise<number> {
    const sessions = responseArray[2];
    const foundCourseID = await Course.findOne({courseId: responseArray[1]}).exec();
    const numStudents = foundCourseID.students.length
    let timeTotal = 0;
    for(let date in sessions){
        sessions[date].forEach(session => {
            timeTotal += session.time;
        })
    }

    return numStudents > 0 ? timeTotal/numStudents: 0 ; 
    
}

/**
 * Gives the average health for all students.
 * @param responeArray with all the data from all the sessions
 * @returns A promise, that gives back a number
 * //TOCHECK
 */
function averageHealth(responseArray:ResponseArray){
    const sessions = responseArray[2];
    let acc = 0;
    let healthTotal = 0;
    for(let date in sessions){
        sessions[date].forEach(session => {
            healthTotal += session.health;
            acc++;
        })
    }return acc > 0 ? healthTotal / acc : 0;
}

/**
 * Gives the average rating for all students.
 * @param responeArray with all the data from all the sessions
 * @returns A promise, that gives back a number
 * //TOCHECK
 */
function averageRating(responseArray:ResponseArray){
    const sessions = responseArray[2];
    let acc = 0;
    let ratingTotal = 0;
    for(let date in sessions){
        sessions[date].forEach(session => {
            ratingTotal += session.gradeSess;
            acc++;
        })
    }return acc > 0 ? ratingTotal / acc : 0;
}

//average rating for lecture over the whole period, if lectures are integrated better, maybe possible to access rating for each lecture
function averageLectureRating(responseArray:ResponseArray){
    const sessions = responseArray[2];
    let acc = 0;
    let ratingTotal = 0
    for(let date in sessions){
        sessions[date].forEach(session =>{
            if(session.typeOfStudy =="Lecture"){
            ratingTotal+=session.gradeSess;
            acc++;
            }
        })
    }return acc > 0 ? ratingTotal / acc : 0;


}
//
function lectureAttendence(){

}

function lastWeeksAttendenceAndAverage(){

}

function averageTimeSpentWeekly(){

}

//returns stats for last week
function lastWeeksAverages(){

}