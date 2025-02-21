import { Query } from "mongoose";
import Course from "../db_models/Course";

export async function addCourse(name:string,courseId:string){
    const newCourse = new Course({
        courseId:courseId,
        name:name,
        student:[]
    })
    console.log(name,courseId);
    await newCourse.save().then(() => {
        console.log("course added");
    })
}

export async function removeCourse(courseId:string){
    let foundCourse = Course.find({courseId:courseId})
    if (foundCourse){
        await Course.deleteOne({ courseId:courseId });
        console.log("removed course")
    }
    console.log("cant find course")

}