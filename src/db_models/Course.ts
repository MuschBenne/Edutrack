import mongoose from 'mongoose';
const {Schema, model} = mongoose;

const course = new Schema ({
    courseId: String,
    name: String,
    students: Array<string>
})

const Course = model("Course", course);

export default Course;