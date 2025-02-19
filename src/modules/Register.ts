import User, { Entry } from "../db_models/User";

export async function HandleRegister(req, res){
  const testUsr = "Jakob";
  const newUser = new User({
      username: testUsr,
      password: "Test",
      mail: "Test",
      class: "Test",
      activeCourses: new Array<String>(),
      pastCourses: new Array<String>(),
      sessions: new Map <String, Map <String, Entry>>()
    });
    
    await newUser.save().then(() => {
          res.send("Success!");
    })
}