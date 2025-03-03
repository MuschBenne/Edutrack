import User from "../db_models/User";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { fetchRegisteredCourses } from "./Application";

export async function RenderLogin(req: Request, res: Response){
    if(req.session["user"])
        res.redirect(307, "/app")
    else
        res.render("Login");
}

export async function HandleLogin(req:Request, res:Response){
    const reqData = req.body;
    try {
        //kolla om user finns
        const foundUser = await User.findOne({username: reqData.user}).exec();
        if(!foundUser) {
            res.status(400).json({ message: "Username does not exist"});
        }
        else {
            //kolla om password matchar
            if(reqData.pass !== foundUser.password) {
                res.status(400).json({ message: "Incorrect password"});
            }
            else {
                // Här sätter vi användarens session
                // TODO: Assigna Admin roll på session till berättigade användare. 
                // Tänk på: Vart ska admin namn sparas? I databasen? Någonstans i koden? Lös som ni vill
                req.session["user"] = foundUser.username;
                res.status(200).json({ message: "Login successful", user:reqData.user });
            }
        }
        
    }
    
    catch (err) {
        if (err instanceof mongoose.Error.ValidationError) {
            console.log("Error adding user due to following schema mismatches: ", Object.keys(err.errors));
            res.status(400).json(err.errors);
        }
        else {
            res.status(500).json({message: "Something went really wrong"});
        } 
    }
}