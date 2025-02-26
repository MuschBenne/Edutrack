import Course from "../db_models/Course";
import User from "../db_models/User";
import mongoose from "mongoose";

export async function addCourse(name: string, courseId: string): Promise<number>{
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

export async function removeCourse(courseId: string){
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

export async function removeStudentFromCourse(courseId: string, username: string){
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

// TOCHECK: Skapa funktion addStudent(courseID: string, username: string)
//       Denna bör lägga till en student i kursens "students" array
//       Granska i removeCourse hur vi hittade en course från ett courseID.
//       Försök lista ut hur man redigerar en property av en course och sedan uppdaterar den i databassen.

export async function addStudent(courseId:string, username: string){

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