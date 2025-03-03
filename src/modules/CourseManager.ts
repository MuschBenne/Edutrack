import Course from "../db_models/Course";
import express, { Request, Response } from 'express';
import User from "../db_models/User";
import mongoose from "mongoose";
import { fetchRegisteredCourses } from "./Application";
import { ResponseArray } from "../App";

export async function HandleCourseManager(req: Request, res: Response){
    let result = [];
    switch(req.query.action) {
        case "addCourse":
            result = await addCourse(req.query.name as string, req.query.courseId as string);
            break;
        case "addStudentToCourse":
            result = await addStudentToCourse(req.query.courseId as string, req.query.username as string);
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
            res.status(400).json({message: "CourseManager: Action [" + req.query.action + "] not found."})
    }
    res.status(result[0]).json({message: result[1], data: result[2]})
}

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

async function removeCourse(courseId: string){
    const foundCourse = Course.find({courseId:courseId}).exec();
    if (foundCourse) {
        await Course.deleteOne({ courseId:courseId });
        console.log("Course with ID " + courseId + " removed.")
        return [200, "Course with ID " + courseId + " removed."];
    }
    else {
        console.log("No course with ID " + courseId + " found.")
        return [400, "No course with ID " + courseId + " found."];
    }
}

async function removeStudentFromCourse(courseId: string, username: string){
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

async function getCourseNameFromId(courseId: string): Promise<string> {
    const foundCourse = await Course.findOne({courseId:courseId}).exec();
    if(!foundCourse)
        return "";
    else
        return foundCourse.name;
}

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

export async function deleteUser(username:string){
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

        const updatedUser = await User.updateOne(
            { username },
            { $pull: { username: username } } 
        );
        if (updatedUser.modifiedCount > 0) {
            console.log("Student " + username + " removed from Users ");
            return [200, "Student " + username + " removed from Users "];
        }
    }
}

// TODO: Statistik: Skriv en funktion fetchAllCourseSessionData som hämtar ett objekt
//                  med alla användares sparade sessioner vid alla datum för denna kurs. Se til att datumen överlappar.
//                  Alltså, om user1 har en array med två sessioner sparade för Feb_10_2024, 
//                  och user2 har en array med två sessioner sparade för samma datum, kommer
//                  det resulterande objektet ha fyra sessioner sparade för det datumet.
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
async function averageTimeSpentOnCourse(responseArray:ResponseArray):Promise<number>{
    const sessions = responseArray[2];
    const foundCourseID = await Course.findOne({courseId: responseArray[1]}).exec();
    const numStudents = foundCourseID.students.length
    let timeTotal = 0;
    for(date in sessions){
        sessions[date].forEach(session => {
            timeTotal += session.time;
        })
    }

    return timeTotal/numStudents; 
    
}
//time spent over the whole period
async function averageHealth(responseArray:ResponseArray):Promise<number>{
    const sessions = responseArray[2];
    const foundCourseID = await Course.findOne({courseId: responseArray[1]}).exec();
    const numStudents = foundCourseID.students.length
    let timeTotal = 0;
    for(date in sessions){
        sessions[date].forEach(session => {
            timeTotal += session.health;
        })
    }
}
//time spent over the whole period
function averageRating(){

}
//returns stats for last week
function lastWeeksAverages(){

}
//average rating for lecture over the whole period, if lectures are integrated better, maybe possible to access rating for each lecture
function averageLectureRating(){

}
//
function lectureAttendence(){

}

function lastWeeksAttendenceAndAverage(){

}

function averageTimeSpentPerWeek(){

}