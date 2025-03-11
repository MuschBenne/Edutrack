import { NextFunction, Request, Response } from "express";
import User, { SessionEntry } from "../db_models/User";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { registerUser } from "./CourseManager";

/**
 * Router function for GET-requests for the route /app/*
 * @param req The Express request object.
 * @param res The Express reponse object.
 * @param next A callback function used to pass control to the next middleware 
 * @precondtion parameters are of appropriate type
 * function in the Express pipeline.
 */
export async function RenderRegister(req: Request, res: Response, next: NextFunction){
    if(req.session.user)
        res.redirect(307, "/app")
    else
        res.render("Register");
}
/**
 * Router function for POST-requests for the route /app/*
 * @param req The Express request object.
 * @param res The Express reponse object.
 * @precondtion parameters are of appropriate type
 */
export async function HandleRegister(req: Request, res: Response){
    const reqData = req.body;
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(reqData.pass, salt);
    // Skapa en nya användare med hjälp av datan från requestet, enligt Schemat som definieras i User.ts.

    const result = await registerUser({
        username: reqData.user,
        password: hash, // Use the hashed password
        mail: reqData.email,
        class: reqData.class,
        activeCourses: {},
    });

    if(result[0] === 200) {
        req.session.user = reqData.user;
    }

    res.status(result[0]).json({message: result[1]});
}
