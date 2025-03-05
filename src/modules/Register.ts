import { NextFunction, Request, Response } from "express";
import User, { SessionEntry } from "../db_models/User";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * Router function for GET-requests for the route /app/*
 * @param req The Express request object.
 * @param res The Express reponse object.
 * @param next A callback function used to pass control to the next middleware function in the Express pipeline.
 */
export async function RenderRegister(req: Request, res: Response, next: NextFunction){
    if(req.session["user"])
        res.redirect(307, "/app")
    else
        res.render("Register");
}
/**
 * Router function for POST-requests for the route /app/*
 * @param req The Express request object.
 * @param res The Express reponse object.
 */
export async function HandleRegister(req: Request, res: Response){
    const reqData = req.body;
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(reqData.pass, salt);
    // Skapa en nya användare med hjälp av datan från requestet, enligt Schemat som definieras i User.ts.
    const newUser = new User({
        username: reqData.user,
        password: hash, // Use the hashed password
        mail: reqData.email,
        class: reqData.class,
        activeCourses: null,
    });

    try {
        // Validera den nyskapade användaren mot hur User's Schema ser ut 
        // (blir fel som catchas om något inte stämmer)
        await User.validate(newUser);

        
        // Försök hitta en användare med det angivna namnet
        const foundUser = await User.findOne({username: reqData.user}).exec();
        // Om foundUser är null...
        const foundEmail = await User.findOne({mail: reqData.email}).exec();
        
        if(!foundUser) {
            if (!foundEmail) {
                await newUser.save().then(() => {
                    req.session["user"] = reqData.user;
                    res.status(200).json({message: "User created"});
                    
                });
            }
            else {  
                res.status(400).json({message:"Email already taken"});
            }
        }
        else {
            res.status(400).json({message:"Username already taken"});
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
    }}
