import Course from "../db_models/Course";
import User from "../db_models/User";
import {addCourse, addStudentToCourse, deleteUser, registerUser, removeCourse, UserBody} from "../modules/CourseManager";
import mongoose from 'mongoose';


beforeAll(async () => {
    await mongoose.connect("mongodb://127.0.0.1:27017/testing");
});

afterAll(async () => {
    Course.collection.drop();
    User.collection.drop();
    await mongoose.disconnect();
});

/**
 * Testing addCourse function
*/
test("[addCourse] - Try adding new course, try adding duplicate course. Ensure course was added successfully.", async () => {
    const courseName = "TestCourse";
    const courseId = "test1234";
    const response1 = await addCourse(courseName, courseId);
    // Duplicate course
    const response2 = await addCourse(courseName, courseId);
    expect(response1[0]).toStrictEqual(200);
    expect(response2[0]).toStrictEqual(400);

    const foundCourseID = await Course.findOne({courseId: courseId}).exec();

    expect(foundCourseID.courseId).toStrictEqual(courseId);
    
});

/**
 * Testing registerStudent function
*/
test("[registerStudent] - Try registering new user. Try registering duplicate username/email. Ensure user exists.", async () => {
    let userBody: UserBody = {
        username: "TestTest1234",
        password: "testPass",
        mail: "test@test.com",
        class: "DV",
        activeCourses: null
    }
    const response1 = await registerUser(userBody);
    // Duplicate username
    const response2 = await registerUser(userBody);
    userBody.username = "TestTest12345";
    // Duplicate email
    const response3 = await registerUser(userBody);

    expect(response1[0]).toStrictEqual(200);
    expect(response2[0]).toStrictEqual(400);
    expect(response3[0]).toStrictEqual(400);

    userBody.username = "TestTest1234";
    const foundUser = await User.findOne({username: userBody.username}).exec();

    expect(foundUser.username).toStrictEqual(userBody.username);
});

/**
 * Testing addStudentToCourse function
*/
test("[addStudentToCourse] - Try adding new student to course. Try registering with unknown student or course. Ensure new student is added to course.", async () => {
    const username = "TestTest1234";
    const nonUsername = "TestTest12345";
    const course = "test1234";
    const nonCourse= "test12345";

    // Expected to work
    const response1 = await addStudentToCourse(course, username);
    // Invalid username
    const response2 = await addStudentToCourse(course, nonUsername);
    // Invalid courseid
    const response3 = await addStudentToCourse(nonCourse, username);

    expect(response1[0]).toStrictEqual(200);
    expect(response2[0]).toStrictEqual(400);
    expect(response3[0]).toStrictEqual(400);

    // Ensure user is in course, and course is in user
    const foundUser = await User.findOne({username: username}).exec();
    const userCourses = Object.keys(foundUser.activeCourses);
    const foundCourse = await Course.findOne({courseId: course}).exec();

    expect(userCourses.includes(course)).toStrictEqual(true);
    expect(foundCourse.students.includes(username)).toStrictEqual(true);
});

/**
 * Testing deleteUser function
*/
test("[deleteUser] - Try removing user, try removing non-existent user, ensure user is removed from database and from courses", async () => {
    const username = "TestTest1234";
    const knownCourse = "test1234"
    const nonUsername = "TestTest12345";
    const response1 = await deleteUser(username);
    // Duplicate course
    const response2 = await deleteUser(nonUsername);
    expect(response1[0]).toStrictEqual(200);
    expect(response2[0]).toStrictEqual(400);

    const foundCourse = await Course.findOne({courseId: knownCourse}).exec();
    const foundCourseStudents = foundCourse.students;
    console.log(foundCourseStudents);
    expect(foundCourse.students.includes(username)).toStrictEqual(false);
});

/**
 * Testing removeCourse function
*/
test("[removeCourse] - Try removing course, try removing non-existent course. Ensure course was removed successfully.", async () => {
    const courseId = "test1234";
    const nonCourseId = "notTest1234";
    const response1 = await removeCourse(courseId);
    // Duplicate course
    const response2 = await removeCourse(nonCourseId);
    expect(response1[0]).toStrictEqual(200);
    expect(response2[0]).toStrictEqual(404);

    const foundCourseID = await Course.findOne({courseId: courseId}).exec();

    expect(foundCourseID).toStrictEqual(null);
});
