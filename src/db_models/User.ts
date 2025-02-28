import mongoose from 'mongoose';
const {Schema, model} = mongoose;

export type Entry = {
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
    activeCourses: Object,
    pastCourses: Object
});

const User = model("User", userSchema);

export default User;

type Bernhard = {
    sound1(); "Tror du det är dig vi är här för att lyssna på ellör!!!",
    sound2(); "Näh, det där var strike 1 O_o",
    sound3(); "Ska du låta han göra sådär?????"
}
type Benjamin = {
    sound1(); "Kalla inte honom för shono",
    sound2(), "Nej nej nej"
}