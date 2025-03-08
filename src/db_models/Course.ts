import mongoose, { Types } from 'mongoose';
import { type } from 'os';
const {Schema, model} = mongoose;

type Course = {
    courseId: string;
    name: string;
    students: Array<string>;
}

const course = new Schema<Course>({
    courseId: { type: String, required: true },
    name: { type: String, required: true },
    students: Array<string>,
})

const Course = model("Course", course);

export default Course;