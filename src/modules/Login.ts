import User from "../db_models/User";
import { Request, Response } from "express";
import mongoose from "mongoose";

export async function HandleLogin(req:Request, res:Response){
    // TODO: Skapa en funktion för att hantera inloggning
    //       Använd Register.ts som mall
    
    const reqData=req.body

    //kolla om user finns
    const foundUser = await User.findOne({username: reqData.user}).exec();
    //kolla om password matchar
    if(foundUser){
        if(password=foundUser.password){
            //login
        }
    }else
        console.log("wrong username or password")
    
}