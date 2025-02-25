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

    // TODO: Se till att en kurs med detta IDt inte redan finns innan vi lägger till den
    const foundCourseID = await Course.findOne({courseId: courseId}).exec();

    const foundCourseName = await Course.findOne({name: name}).exec();

    if (!foundCourseID) {
        if (!foundCourseName) {
            await newCourse.save().then(() => {
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
    }
    else {
        console.log("No course with ID " + courseId + " found.")
    }

}

// TODO: Skapa funktion addStudent(courseID: string, studentID: string)
//       Denna bör lägga till en student i kursens "students" array
//       Granska i removeCourse hur vi hittade en course från ett courseID.
//       Försök lista ut hur man redigerar en property av en course och sedan uppdaterar den i databassen.

export async function addStudent(courseId:string, studentId: string){
    //kolla om course finns
    const foundCourse = Course.find({courseId:courseId}).exec();
    //kolla om student finns && inte finns i course
    const foundUser = User.find({studentId:studentId}).exec();

    //lägg till i course arrayen
    Course.updateOne(
        {courseId:courseId},
        {$addToSet: {students:studentId}} //TOCHECK studentID inte defined i databas, borde läggas till?

    )

    //uppdatera students active course
    User.updateOne(
        {studentId:studentId},
        {$addToSet: {activeCourses:courseId}} //TOCHECK kanske att man vill läga till namnet så att det blir lätt att visa kurser man går
    )
}