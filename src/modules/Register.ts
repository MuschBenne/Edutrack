import { Request, Response } from "express";
import User, { Entry } from "../db_models/User";
import mongoose from "mongoose";

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
    try {
        await User.validate(newUser);
        let foundUser = await User.findOne({username: reqData.user}).exec();
        if(!foundUser){
            await newUser.save().then(() => {
                res.sendStatus(200);
            });
        }
        else {
            res.sendStatus(400);
        }
    }
    catch (err){
        if (err instanceof mongoose.Error.ValidationError)
            console.log("Error adding user due to following schema mismatches: ", Object.keys(err.errors));
        else
            console.log("Error:", err);
    }
}