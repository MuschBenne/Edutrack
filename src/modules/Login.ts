import User from "../db_models/User";
import { Request, Response } from "express";
import mongoose from "mongoose";

export async function RenderLogin(req: Request, res: Response){
    // TODO: Se till att en redan inloggad användare redirectas till /app istället.
    //       använd res.redirect().
    res.render("Login");
}

export async function HandleLogin(req:Request, res:Response){
    // TOOCHECK: Skapa en funktion för att hantera inloggning
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
                req.session["user"] = foundUser.username;
                // TODO: Använd res.redirect för att omdirigera användaren till /app
                res.status(403).redirect("/app")
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