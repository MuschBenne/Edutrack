import mongoose from 'mongoose';
const {Schema, model} = mongoose;

const course = new Schema ({
    courseId: String,
    students: Array<String>
})

const Course = model("Course", course);

export default Course;