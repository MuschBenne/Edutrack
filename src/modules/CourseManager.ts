import Course from "../db_models/Course";
import express, { Request, Response } from 'express';
import User from "../db_models/User";
import mongoose from "mongoose";
import { fetchRegisteredCourses } from "./Application";

export async function HandleCourseManager(req: Request, res: Response){
    console.log(req.query);
	// Exempel: if(req.query.action === "addCourse") { ... } else if(req.query.action === "removeCourse") osv.
	// Vi använder res.sendStatus för att skicka ett svar med en statuskod. Koden returneras från addCourse
	// baserat på huruvida funktionen kunde genomföras
    switch(req.query.action) {
        case "addCourse":
            res.sendStatus(await addCourse(req.query.name as string, req.query.courseId as string));
            break;
        case "addStudentToCourse":
            res.sendStatus(await addStudentToCourse(req.query.courseId as string, req.query.username as string));
            break;
        case "removeCourse":
            res.sendStatus(await removeCourse(req.query.courseId as string)); // TOCHECK
            break;
        case "deleteUser":
            res.sendStatus(await deleteUser(req.query.username as string)); // TOCHECK: Implementera deleteUser
            break;
        case "removeStudentFromCourse": // TOCHECK
            res.sendStatus(await removeStudentFromCourse(req.query.courseID as string, req.query.username as string));
            break;
        default:
            res.status(400).json({message: "CourseManager: Action [" + req.query.action + "] not found."})
    }
}

async function addCourse(name: string, courseId: string): Promise<number>{
    const newCourse = new Course({
        courseId:courseId,
        name:name,
        students:[]
    })
    console.log(name,courseId);

    // TOCHECK: Se till att en kurs med detta IDt inte redan finns innan vi lägger till den
    // CHECKED: Ser väl bra ut, frågan är bara om fler kurser får ha samma namn? Framtida terminer, samma kursnamn?
    const foundCourseID = await Course.findOne({courseId: courseId}).exec();

    const foundCourseName = await Course.findOne({name: name}).exec();

    if (!foundCourseID) {
        if (!foundCourseName) {
            return await newCourse.save().then(() => {
                console.log("course added");
                return 200;
            });
        }
        else {
            return 400;
        }
    }
    
}

async function removeCourse(courseId: string){
    const foundCourse = Course.find({courseId:courseId}).exec();
    if (foundCourse) {
        await Course.deleteOne({ courseId:courseId });
        console.log("Course with ID " + courseId + " removed.")
        return 200;
    }
    else {
        console.log("No course with ID " + courseId + " found.")
        return 400; //TOCHECK
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
            return 200;
        } else {
            console.log("Student " + username + " not found in course " + courseId);
            return 400;
        }
    } catch (error) {
        console.error("Error removing student:", error);
        return 500; //TOCHECK
    }
}

async function addStudentToCourse(courseId:string, username: string){

    const foundCourse = Course.find({courseId:courseId}).exec();
    const foundUser = User.find({username:username}).exec();

    if(foundCourse && foundUser) {
        //lägg till i course arrayen
        Course.updateOne(
            {courseId:courseId},
            {$addToSet: {students:username}} //TOCHECK 

        ).exec();
        //uppdatera students active course
        User.updateOne(
            {username:username},
            {$addToSet: {activeCourses:courseId}} //TOCHECK 
        ).exec();
        return 200;
    }
    else {
        console.log("student eller course finns inte");
        return 400;
    }
}

export async function deleteUser(username:string){
    const foundUser = await User.findOne({username:username}).exec();
    if(!foundUser) {
        console.log("student not found");
        return 400;
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
            return 200;
        }
    }
}

