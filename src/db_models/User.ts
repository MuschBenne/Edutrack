import mongoose, { Types } from 'mongoose';
const {Schema, model} = mongoose;

export type SessionEntry = {
    time: Number,
    typeOfStudy: String,
    gradeSess: Number,
    health: Number,
    mentalHealth: Number
}

export type SessionList = {
    [sessionDate: string]: Array<SessionEntry>;
}

export type CourseEntry = {
    courseId: string;
    name: string;
    sessions: null | SessionList;
}

export type CourseList = {
    [courseName: string]: CourseEntry;
}

interface IUser {
    username: string;
    password: string;
    mail: string;
    class: string;
    activeCourses: null | CourseList;
}

const userSchema = new Schema<IUser>({
    username: { type: String, required: true },
    password: { type: String, required: true },
    mail: { type: String, required: true },
    class: { type: String, required: true },
    activeCourses: { type: Object, required: true },
});

const User = model("User", userSchema);

export default User;