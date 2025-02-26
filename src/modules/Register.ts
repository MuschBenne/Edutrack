import { Request, Response } from "express";
import User, { Entry } from "../db_models/User";
import mongoose from "mongoose";

export async function HandleRegister(req: Request, res: Response){
    const reqData = req.body;
    // Skapa en nya användare med hjälp av datan från requestet, enligt Schemat som definieras i User.ts.
    const newUser = new User({
        username: reqData.user,
        password: reqData.pass,
        mail: reqData.email,
        class: reqData.class,
        activeCourses: new Array<string>(),
        pastCourses: new Array<string>(),
        sessions: {debug: "test"}
    });

    // Try/catch statements, försöker en grej, avbryter och gör en annan grej om något går fel.
    // (läs på om det känns konstigt)
    try {
        // Validera den nyskapade användaren mot hur User's Schema ser ut 
        // (blir fel som catchas om något inte stämmer)
        await User.validate(newUser);

        // TOCHECK: Försäkra att användare med den angivna [emailen] inte finns
        // Försök hitta en användare med det angivna namnet
        const foundUser = await User.findOne({username: reqData.user}).exec();
        // Om foundUser är null...
        const foundEmail = await User.findOne({mail: reqData.email}).exec();
        
        if(!foundUser){
            if (!foundEmail)
                await newUser.save().then(() => {
                res.status(200).json({message: "User created"});
            });
        }
    }
    catch (err) {
            if (err instanceof mongoose.Error.ValidationError){
                        console.log("Error adding user due to following schema mismatches: ", Object.keys(err.errors));
                        res.status(400).json(err.errors);
            }
            else {
            res.status(500).json({message: "Something went really wrong"});
            } 
        }
}
