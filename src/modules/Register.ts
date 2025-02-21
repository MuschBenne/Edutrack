import { Request, Response } from "express";
import User, { Entry } from "../db_models/User";

// fixa lite if saster för vad som kan gå åt HELVETE
export async function HandleRegister(req: Request, res: Response){
    const reqData = req.body;
    const newUser = new User({
        username: reqData.user,
        password: reqData.pass,
        mail: reqData.email,
        class: reqData.class,
        activeCourses: new Array<String>(),
        pastCourses: new Array<String>(),
        sessions: new Map <String, Map <String, Entry>>()
    });
      
    await newUser.save().then(() => {
        res.sendStatus(200);
    })
}