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

type Bernhard = {
    sound1(); "Tror du det är dig vi är här för att lyssna på ellör!!!",
    sound2(); "Näh, det där var strike 1 O_o",
    sound3(); "Ska du låta han göra sådär?????"
}