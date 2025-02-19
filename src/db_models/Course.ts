import mongoose from 'mongoose';
const {Schema, model} = mongoose;

const course = new Schema ({
    courseId: String,
    students: Array<String>,
    sessions: Array<Array<"datastruktur för sess">>

})