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

        // TODO: Försäkra att användare med den angivna [emailen] inte finns
        // Försök hitta en användare med det angivna namnet
        const foundUser = await User.findOne({username: reqData.user}).exec();
        // Om foundUser är null...
        if(!foundUser){
            await newUser.save().then(() => {
                res.sendStatus(200);
            });
        }
        // Om foundUser inte är null...
        else {
            console.log("Error: User already found");
            res.sendStatus(400);
        }
    }
    // Denna del av koden nås om await User.validate(newUser); misslyckas.
    catch (err){
        if (err instanceof mongoose.Error.ValidationError){
            console.log("Error adding user due to following schema mismatches: ", Object.keys(err.errors));
            res.status(400).json(err.errors);
        }
        else {
            console.log("Error:", err);
            res.status(400).json(err.message);
        }
    }
}