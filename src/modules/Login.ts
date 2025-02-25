import User from "../db_models/User";
import { Request, Response } from "express";
import mongoose from "mongoose";

export async function HandleLogin(req:Request, res:Response){
    // TOOCHECK: Skapa en funktion för att hantera inloggning
    const reqData=req.body
    try {
        //kolla om user finns
        const foundUser = await User.findOne({username: reqData.user}).exec();
        if(!foundUser){
        res.status(400).json({ message: "user doenst exist"});
        }else
            //kolla om password matchar
            if(reqData.pass!==foundUser.password){
                res.status(400).json({ message: "password doesnt match"});
            }else{
                res.status(200).json({ message: "Login successful", user:reqData.user });
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