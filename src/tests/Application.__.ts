import Course from "../db_models/Course";
import User, { SessionEntry } from "../db_models/User";
import {addCourse, addStudentToCourse, deleteUser, registerUser, removeCourse, UserBody} from "../modules/CourseManager";
import {addStudySession, fetchRegisteredCourses, fetchUserCourseData, fetchAvailableCourses} from "../modules/Application"
import mongoose from 'mongoose';

beforeAll(async () => {
    await mongoose.connect("mongodb://127.0.0.1:27017/testing");
    await addCourse("TestCourse1", "test1");
    await addCourse("TestCourse2", "test2");
    await addCourse("TestCourse3", "test3");
    let userBody1: UserBody = {
        username: "TestUser1",
        password: "testPass",
        mail: "test@test.se",
        class: "DV",
        activeCourses: null
    }
    let userBody2: UserBody = {
        username: "TestUser2",
        password: "testPass",
        mail: "test@test.com",
        class: "DV",
        activeCourses: null
    }
    await registerUser(userBody1);
    await registerUser(userBody2);

    await addStudentToCourse("test1", userBody1.username);
    await addStudentToCourse("test2", userBody1.username);

    await addStudentToCourse("test1", userBody2.username);
    await addStudentToCourse("test3", userBody2.username);
});

afterAll(async () => {
    Course.collection.drop();
    User.collection.drop();
    await mongoose.disconnect();
});

/**
 * Testing addCourse function
*/
test("[addStudySession] - Try adding new course, try adding duplicate course. Ensure course was added successfully.", async () => {
    const session1: SessionEntry = {
        time: 5,
        typeOfStudy: "Selfstudies",
        gradeSess: 2,
        health: 3,
        mentalHealth: 4
    }

    const session2: SessionEntry = {
        time: 10,
        typeOfStudy: "Homework",
        gradeSess: 4,
        health: 3,
        mentalHealth: 2
    }

    const session3: SessionEntry = {
        time: 15,
        typeOfStudy: "Project",
        gradeSess: 3,
        health: 4,
        mentalHealth: 5
    }
    const courseId = "test1";
    const response1 = await addCourse(courseName, courseId);
    // Duplicate course
    const response2 = await addCourse(courseName, courseId);
    expect(response1[0]).toStrictEqual(200);
    expect(response2[0]).toStrictEqual(400);

    const foundCourseID = await Course.findOne({courseId: courseId}).exec();

    expect(foundCourseID.courseId).toStrictEqual(courseId);
    
});