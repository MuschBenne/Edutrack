import User, { Entry } from "../db_models/User";

// fixa lite if saster för vad som kan gå åt HELVETE
export async function HandleRegister(req, res){
  const testUsr = JSON.parse(req.body)
  const newUser = new User({
      username: testUsr.user,
      password: testUsr.pass,
      mail: testUsr.email,
      klass: testUsr.klass,
      activeCourses: new Array<String>(),
      pastCourses: new Array<String>(),
      sessions: new Map <String, Map <String, Entry>>()
    });
    
    await newUser.save().then(() => {
          res.send("Success!");
    })
}