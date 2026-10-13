import Course from "../src/db_models/Course";
import User, { SessionEntry, SessionList } from "../src/db_models/User";
import {addCourse, addStudentToCourse, deleteUser, fetchAllCourseSessionData, registerUser, removeCourse, UserBody} from "../src/modules/CourseManager";
import {addStudySession, fetchRegisteredCourses, fetchUserCourseData, fetchAvailableCourses} from "../src/modules/Application"
import mongoose from 'mongoose';
import { Session } from "express-session";

let userBody1: UserBody = {
    username: "TestUser1",
    password: "testPass",
    mail: "test@test.se",
    class: "DV",
    activeCourses: {}
}
let userBody2: UserBody = {
    username: "TestUser2",
    password: "testPass",
    mail: "test@test.com",
    class: "DV",
    activeCourses: {}
}

beforeAll(async () => {
    await mongoose.connect("mongodb://127.0.0.1:27017/testing");
    await addCourse("TestCourse1", "test1");
    await addCourse("TestCourse2", "test2");
    await addCourse("TestCourse3", "test3");
    await registerUser(userBody1);
    await registerUser(userBody2);

    await addStudentToCourse("test1", userBody1.username);
    await addStudentToCourse("test2", userBody1.username);

    await addStudentToCourse("test1", userBody2.username);
    await addStudentToCourse("test3", userBody2.username);
});

afterAll(async () => {
    await Course.deleteMany({});
    await User.deleteMany({});
    await mongoose.disconnect();
});

/**
 * Testing addCourse function
*/
test("[addStudySession] - Try adding new sessions. Valid request, invalid user, invalid course. Ensure sessions have been added.", async () => {
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

    const courseId1 = "test1";
    const courseId2 = "test2";
    const courseId3 = "test3";
    const nonCourseId = "test4";

    // Valid requests
    const response1 = await addStudySession(userBody1.username, courseId1, session1);
    const response2 = await addStudySession(userBody1.username, courseId1, session2);
    const response3 = await addStudySession(userBody1.username, courseId2, session2);

    // For future test
    await addStudySession(userBody2.username, courseId1, session1);
    await addStudySession(userBody2.username, courseId1, session2);
    await addStudySession(userBody2.username, courseId1, session3);
    
    // Try to add user to nonexisting course
    const response4 = await addStudySession(userBody1.username, nonCourseId, session2);

    // Try to add nonexisting user to course
    const response5 = await addStudySession("nonUser", courseId1, session2);

    // Add session to course that user is not registered to
    const response6 = await addStudySession(userBody1.username, courseId3, session3);

    // Valid requests    
    expect(response1[0]).toStrictEqual(200);
    expect(response2[0]).toStrictEqual(200);
    expect(response3[0]).toStrictEqual(200);

    // Invalid requests
    expect(response4[0]).toStrictEqual(400);
    expect(response5[0]).toStrictEqual(400);
    expect(response6[0]).toStrictEqual(400);

    const foundUser = await User.findOne({username: userBody1.username}).exec();
    if( !foundUser 
        || !foundUser.activeCourses 
        || !foundUser.activeCourses[courseId1] 
        || !foundUser.activeCourses[courseId1].sessions)
        return;
    const dates: Array<string> = Object.keys(
        foundUser.activeCourses[courseId1].sessions
    );
    expect(dates.length).toStrictEqual(1);
    const sessionArray: Array<SessionEntry> = foundUser.activeCourses[courseId1].sessions[dates[0]];
    expect(sessionArray.length).toStrictEqual(2);
    
});

test("[fetchRegisteredCourses] - Try fetching array of users' course data. Try to fetch data for nonexisting user.", async () => {
    const courseId1 = "test1";
    const nonUser = "nonuser";
    
    const response1 = await fetchRegisteredCourses(userBody1.username);
    const response2 = await fetchRegisteredCourses(nonUser);

    expect(response1.length).toStrictEqual(2);
    expect(response1[0].courseId).toStrictEqual(courseId1);
    expect(response2.length).toStrictEqual(0);
});

test("[fetchUserCourseData] - Fetch CourseEntry object for a user and course ID. Try nonexisting user. Try non-registered course.", async () => {
    const courseId1 = "test1";
    const courseId2 = "test3";
    const nonUser = "nonuser";
    
    const response1 = await fetchUserCourseData(userBody1.username, courseId1);
    // Course user is not registered to.
    const response2 = await fetchUserCourseData(userBody1.username, courseId2);
    // Non-existing user
    const response3 = await fetchUserCourseData(nonUser, courseId1);

    expect(response1).not.toStrictEqual({});
    expect(response2).toStrictEqual({});
    expect(response3).toStrictEqual({});
});

test("[fetchAvailableCourses] - Fetch all courses user1 is not registered to. Add user1 to last available course, then try fetching and expect empty array.", async () => {
    const courseId = "test3";
    
    // Expect test3 as only available course
    const response1 = await fetchAvailableCourses(userBody1.username);

    // Add user to test3
    await addStudentToCourse(courseId, userBody1.username);

    // Expect no available courses
    const response2 = await fetchAvailableCourses(userBody1.username);

    expect(response1.length).toStrictEqual(1);
    expect(response2.length).toStrictEqual(0);
});

test("[(CourseManager.ts) fetchAllCourseSessionData] - Fetch all users' session data for a course. Try fetching this data from nonexisting course. Try fetching this data for a course without any registered students.", async () => {

    const courseId1 = "test1";
    const courseId2 = "test5";
    const nonCourseId = "test12345";
    
    // Valid request
    const response1 = await fetchAllCourseSessionData(courseId1);
    
    // Invalid request due to nonexisting course
    const response2 = await fetchAllCourseSessionData(nonCourseId);
    
    // Add a new course, don't register any users
    await addCourse("TestCourse5", courseId2);

    // Invalid request due to empty course
    const response3 = await fetchAllCourseSessionData(courseId2);
    
    // Find the SessionEntry array for today's date
    const sessionList = (response1[2] as SessionList);
    const sessionListValues = Object.values(sessionList);
    const todaysSessionArray = sessionListValues[0];

    // Expect 5 sessions registered by 2 users
    expect(todaysSessionArray.length).toStrictEqual(5);
    // Expect error due to nonexisting course
    expect(response2[0]).toStrictEqual(400);
    // Expect error due to no users registered to course
    expect(response3[0]).toStrictEqual(400);
});