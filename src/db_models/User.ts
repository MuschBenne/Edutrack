import mongoose from 'mongoose';
const {Schema, model} = mongoose;

export type SessionEntry = {
    time: Number,
    typeOfStudy: String,
    gradeSess: Number,
    health: Number,
    mentalHealth: Number
}

const userSchema = new Schema({
    username: String,
    password: String,
    mail: String,
    class: String,
    activeCourses: Object,
});

const User = model("User", userSchema);

export default User;