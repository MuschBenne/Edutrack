import Course from "../db_models/Course";
import {addCourse, removeCourse} from "../modules/CourseManager";
import mongoose from 'mongoose';


/**
 * Testing addCourse function
*/

test("[addCourse] - Try adding new course, try adding duplicate course. Ensure course was added successfully.", async () => {
    await mongoose.connect("mongodb://127.0.0.1:27017/testing");
    const courseName = "TestCourse";
    const courseId = "test1234";
    const response1 = await addCourse(courseName, courseId);
    // Duplicate course
    const response2 = await addCourse(courseName, courseId);
    expect(response1[0]).toStrictEqual(200);
    expect(response2[0]).toStrictEqual(400);

    const foundCourseID = await Course.findOne({courseId: courseId}).exec();

    expect(foundCourseID.courseId).toStrictEqual(courseId);
    await mongoose.disconnect();
});

test("[removeCourse] - Try removing course, try removing non-existent course. Ensure course was removed successfully.", async () => {
    await mongoose.connect("mongodb://127.0.0.1:27017/testing");
    const courseId = "test1234";
    const nonCourseId = "notTest1234";
    const response1 = await removeCourse(courseId);
    // Duplicate course
    const response2 = await removeCourse(nonCourseId);
    expect(response1[0]).toStrictEqual(200);
    expect(response2[0]).toStrictEqual(404);

    const foundCourseID = await Course.findOne({courseId: courseId}).exec();

    expect(foundCourseID).toStrictEqual(null);
    await mongoose.disconnect();
});

test("[registerStudent] - Try registering new user. Try registering duplicate user. Try registering.", async () => {
    await mongoose.connect("mongodb://127.0.0.1:27017/testing");
    const courseId = "test1234";
    const nonCourseId = "notTest1234";
    const response1 = await removeCourse(courseId);
    // Duplicate course
    const response2 = await removeCourse(nonCourseId);
    expect(response1[0]).toStrictEqual(200);
    expect(response2[0]).toStrictEqual(404);

    const foundCourseID = await Course.findOne({courseId: courseId}).exec();

    expect(foundCourseID).toStrictEqual(null);
    await mongoose.disconnect();
});