import Course from "../db_models/Course";
import express, { Request, Response } from 'express';
import User from "../db_models/User";
import { fetchRegisteredCourses } from "./Application";
import { ResponseArray } from "../App";
import mongoose, { Types } from "mongoose";

/**
 * UserBody type for the registerUser function parameter.
 * Ensures valid datatypes for registerUser.
 */
export type UserBody = {
    username: string,
    password: string,
    mail: string,
    class: string,
    activeCourses: Object | null
}

/**
 * Router function for POST-requests to the path /courseManager
 * @param req The Express request object
 * @param res The Express response object
 * @precondtion parameters are of appropriate type
 */
export async function HandleCourseManager(req: Request, res: Response) {
    let result: ResponseArray;

    // Check if the user is an admin only once before the switch
    if (!req.session.isAdmin) {
        return res.status(400).json({ message: `Access denied, admins only! (${req.session.user} is not an admin)` });
    }

    // If the user is an admin, proceed with the switch
    switch (req.query.action) {
        case "addCourse":
            result = await addCourse(
                req.query.name as string, 
                req.query.courseId as string
            );
            break;

        case "removeCourse":
            result = await removeCourse(req.query.courseId as string);
            break;

        case "deleteUser":
            result = await deleteUser(req.query.username as string);
            break;

        case "removeStudentFromCourse":
            result = await removeStudentFromCourse(
                req.query.courseID as string, 
                req.query.username as string
            );
            break;

        case "fetchRegisteredCourses":
            result = [200, "Success", 
                await fetchRegisteredCourses(req.query.username as string)
            ];
            break;

        case "fetchAllCourseSessionData":
            result = await fetchAllCourseSessionData(
                req.query.courseID as string
            );
            break;

        default:
            result = [404, 
                "CourseManager: Action [" + req.query.action + "] not found."
            ];
    }

    res.status(result[0]).json({ message: result[1], data: result[2] });
}

/**
 * Add a course to the list of public courses, of which eligible users can elect to register to.
 * @param name Student username
 * @param courseId Course identifier
 * @precondtion parameters are of appropriate type
 * @returns A promise, resolving into a ResponseArray.
 * @example
 * // returns Promise<ResponseArray> => [200, "Course added"] 
 * // iff the courseId is not already registered.
 * addCourse("PKD", "PKD_VT25")
 */
export async function addCourse(name: string, courseId: string): Promise<ResponseArray> {
    const newCourse = new Course({
        courseId:courseId,
        name:name,
        students:[]
    })
    console.log(name,courseId);

    const foundCourseID = await Course.findOne({courseId: courseId}).exec();

    if (!foundCourseID) {
            return await newCourse.save().then(() => {
                console.log("Course added");
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
 * @precondtion parameters are of appropriate type
 * @returns A promise, resolving into a ResponseArray containing a status code and a message
 * @example
 * // returns Promise<ResponseArray> => [200, "Course PKD_VT25 removed."] 
 * // iff a course with courseID PKDVT25 exists in the database.
 * removeCourse("PKDVT25")
 */
export async function removeCourse(courseId: string): Promise<ResponseArray> {
    const foundCourse = await Course.findOne({ courseId: courseId }).exec();

    if (!foundCourse) {
        console.log("Course not found.");
        return [404, "Course not found."];
    }

    foundCourse.students.forEach(async (username) => {
        let foundUser = await User.findOne({username: username}).exec();
        if(!foundUser || !foundUser.activeCourses || !foundUser.activeCourses[courseId])
            return;
        delete foundUser.activeCourses[courseId];
        foundUser.markModified("activeCourses");
        await foundUser.save();
    });

    await Course.deleteOne({ courseId: courseId });
    console.log("Course " + courseId + " removed.");
    return [200, "Course " + courseId + " removed."]
}

/**
 * Removes a student from a course
 * @param courseId Course identifier
 * @param username User identifier
 * @precondtion parameters are of appropriate type
 * @returns A promise, resolving into a ResponseArray containing a status code and a message
 * @example
 * // returns Promise<ResponseArray> => [200, "Student JK removed from course."]
 * // iff a User with username "JK" and a course with ID "PKD_VT25" exists
 * removeStudentFromCourse("PKD_VT25", "JK");
 */
export async function removeStudentFromCourse(courseId: string, username: string): Promise<ResponseArray> {
    try {
        const foundCourse = await Course.findOne({courseId:courseId}).exec();
        if (!foundCourse) {
            console.log(`No course found with ID: ${courseId}`);
            return [400, `No course found with ID: ${courseId}`];
        }

        const foundCourseStudents: Array<String> | undefined | null = foundCourse.students;

        if(!foundCourseStudents){
            throw new Error("Course's .students property was null or undefined");
        }

        if(!foundCourseStudents.includes(username)) {
            console.log("Student " + username + " not found in course " + courseId);
            return [400, "Student " + username + " not found in course " + courseId];
        }

        // New array with supplied username filtered out
        foundCourse.students = foundCourse.students.filter((e) => {e != username});

        foundCourse.markModified("students");
        return await foundCourse.save().then(() => {
            console.log("Student " + username + " removed from course " + courseId);
            return [200, "Student " + username + " removed from course " + courseId];
        });

    } catch (error) {
        console.error("Error removing student:", error);
        return [500, "Error removing student: " + error];
    }
}

/**
 * Returns the course name for a course with a supplied course ID
 * @precondtion parameters are of appropriate type
 * @param courseId (String) Course identifier
 * @returns Either the name of the matching course, or an empty string.
 * @example
 * // returns Promise<string> => "PKD"
 * // iff a course with ID "PKD_VT25" exists and that course's name is "PKD"
 * getCourseNameFromId("PKD_VT25");
 */
export async function getCourseNameFromId(courseId: string): Promise<string> {
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
 * @precondtion parameters are of appropriate type
 * @returns A promise, resolving into a ResponseArray containing a status code and a message
 * @example 
 * // returns Promise<ResponseArray> => [200, "Student added to course PKD25"]
 * // iff a User with username "JK" and a Course with ID "PKD25" exists.
 * addStudentToCourse("PKD25", "JK");
 */
export async function addStudentToCourse(courseId:string, username: string): Promise<ResponseArray>{

    const foundCourse = await Course.findOne({courseId:courseId}).exec();
    const foundUser = await User.findOne({username:username}).exec();

    if(foundCourse && foundCourse.students.includes(username)){
        return [400, "Action 'addStudentToCourse' failed: Student is already registered to this course"];
    }

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
        return await foundUser.save().then(() => {
            console.log("Student added to course " + courseId);
            return [200, "Student added to course " + courseId];
        });
    }
    else {
        console.log("Action 'addStudentToCourse' failed: Invalid student " + username + " or course " + courseId);
        return [400, "Action 'addStudentToCourse' failed: Invalid student " + username + " or course " + courseId];
    }
}


/**
 * Deletes a user from all courses and database
 * @param username User identifier
 * @precondtion parameters are of appropriate type
 * @returns A promise, resolving into a ResponseArray containing a status code and a message
 * @example
 * // returns Promise<ResponseArray> => [200, "Student JK removed from Users"]
 * // iff a User with username "JK" exists
 * deleteUser("JK");
 */
export async function deleteUser(username:string): Promise<ResponseArray> {
    const foundUser = await User.findOne({username:username}).exec();
    if(!foundUser) {
        console.log(`Action deleteUser failed: User ${username} not found`);
        return [400, "Action deleteUser failed: User not found"];
    }
    else {
        const activeCourses = await fetchRegisteredCourses(username)
        for(let i = 0; i < activeCourses.length; i++){
            console.log((await removeStudentFromCourse(activeCourses[i]["courseId"],username))[1]);
        }
        const deletedUser = await User.deleteOne({ username });
        if (deletedUser.deletedCount > 0) {
            console.log(`Student ${username} removed from Users`);
            return [200, `Student ${username} removed from Users`];
        }
        else {
            console.log(`Student ${username} was not removed from Users (Deleted usercount < 1)`);
            return [200, `Student ${username} was not removed from Users (Deleted usercount < 1)`];
        }

    }
}

/**
 * Register a student to the User database table.
 * If a student with the supplied username or email exists, reject the request.
 * @precondtion parameters are of appropriate type
 * @param userBody (UserBody): The data for the student to be registered.
 * @returns A promise, resolving into a ResponseArray containing a status code and response message.
 * @example 
 * // returns Promise<ResponseArray> => [200, "User created"]
 * // iff User with UB.username or UB.mail does not exist in the database
 * let UB: UserBody = {
 *  username: "JK",
 *  password: "MFSDKFG2342345",
 *  mail: "JK@test.com",
 *  class: "DV",
 *  "activeCourses: {}"
 * }
 * registerUser(UB);
 */
export async function registerUser(userBody: UserBody): Promise<ResponseArray> {
    try {
        // Skapa det nya User dokumentet
        let newUser = new User(userBody);
        // Validera den nyskapade användaren mot hur User's Schema ser ut 
        // (blir fel som catchas om något inte stämmer)
        await User.validate(newUser);
        
        // Försök hitta en användare med det angivna namnet
        const foundUser = await User.findOne(
            {username: userBody.username}
        ).exec();
        // Om foundUser är null...
        const foundEmail = await User.findOne({mail: userBody.mail}).exec();
        
        if(!foundUser) {
            if (!foundEmail) {
                return await newUser.save().then(() => {
                    return [200, "User created"];
                });
            }
            else {  
                return [400, "Email already taken"];
            }
        }
        else {
            return [400, "Username already taken"];
        }
    }
    catch (err) {
        if (err instanceof mongoose.Error.ValidationError) {
            console.log("Error adding user due to following schema mismatches: ", Object.keys(err.errors));
            return [400, "Error adding user due to following schema mismatches:", err.errors];
        }
        else {
            return [500, "Something went really wrong"];
        } 
    }
}

/**
 * Fetches all session data from all courses and users
 * @param courseId Course identifier
 * @precondtion parameters are of appropriate type
 * @returns A promise, resolving into a ResponseArray containing a status code and all the data
 * @example
 * // returns Promise<ResponseArray> => [200, "Successfully fetched all session data for PKD_VT25.", {}];
 * // iff a Course with ID "PKD_VT25" exists and has no registered sessions.
 * fetchAllCourseSessionData("PKD_VT25");
 */
export async function fetchAllCourseSessionData(courseId: string): Promise<ResponseArray> {
    // Try to find a course matching the ID supplied
    const foundCourseID = await Course.findOne({courseId: courseId}).exec();
    if(!foundCourseID) {
        return [400, "No course with ID " + courseId + " found."];
    }

    // Ensure any students are registered to the course
    let students: Array<string> = foundCourseID.students;
    if(students.length==0) {
        return [400, "No students registered on" + courseId + " found."];
    }

    // If there are registered students...
    // Establish a returnable session data object
    let allSessions: { [date: string]: any[] } = {};
    
    // For every registered student's name
    for(let i = 0; i < students.length; i++) {
        // Find a user matching the username supplied
        let student = students[i];
        const foundUser = await User.findOne(
            { username: student }
        ).exec(); 
        
        // If user wasn't found, skip to the next registered user's name
        if (!foundUser) {
            console.log("Registered user " + student + " not found. Has user been removed from DB?");
            continue;
        }

        if (!foundUser.activeCourses) {
            console.log("Registered user " + student + " has an uninitialized activeCourses property.");
            continue;
        }

        // If the user was found, append all it's registered sessions for a date
        // to the allSessions object's corresponding date's array of sessions.
        const sessions = foundUser.activeCourses[courseId]["sessions"] ?? {};
        for (let sessionDate in sessions) {
            allSessions[sessionDate] ??= [];
            allSessions[sessionDate].push(...sessions[sessionDate]);
        }
    };
    
    return [200, `Successfully fetched all session data for ${courseId}.`, allSessions];
}