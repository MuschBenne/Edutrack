import Course from "../db_models/Course";

export async function addCourse(name: string, courseId: string): Promise<number>{
    const newCourse = new Course({
        courseId:courseId,
        name:name,
        students:[]
    })
    console.log(name,courseId);

    // TODO: Se till att en kurs med detta IDt inte redan finns innan vi lägger till den

    await newCourse.save().then(() => {
        console.log("course added");
        return 200;
    });
    
    return 400;
}

export async function removeCourse(courseId: string){
    const foundCourse = Course.find({courseId:courseId}).exec();
    if (foundCourse) {
        await Course.deleteOne({ courseId:courseId });
        console.log("Course with ID " + courseId + " removed.")
    }
    else {
        console.log("No course with ID " + courseId + " found.")
    }

}

// TODO: Skapa funktion addStudent(courseID: string, studentID: string)
//       Denna bör lägga till en student i kursens "students" array
//       Granska i removeCourse hur vi hittade en course från ett courseID.
//       Försök lista ut hur man redigerar en property av en course och sedan uppdaterar den i databassen.