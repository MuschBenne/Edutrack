import mongoose from 'mongoose';
const {Schema, model} = mongoose;

type Entry = {
    time: Number,
    typeOfStudy: String,
    gradeSess: Number,
    health: Number
}

const userSchema = new Schema({
    username: String,
    password: String,
    mail: String,
    class: String,
    activeCourses: Array<String>,
    pastCourses: Array<String>,
    sessions: Map <String, Map <String, Entry>>
});

const User = model("User", userSchema);

export default User;