import User from "../db_models/User";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { fetchRegisteredCourses } from "./Application";
import bcrypt from "bcryptjs";

/**
 * Router function for GET-requests for the route /login
 * If a user is already logged in, this redirects the user to the app page.
 * Otherwise, the login page is rendered.
 * @precondtion parameters are of appropriate type
 * @param req The Express request object.
 * @param res The Express reponse object.
 */
export async function RenderLogin(req: Request, res: Response){
    if(req.session.user)
        res.redirect(307, "/app")
    else
        res.render("Login");
}
/**
 * Handles the POST request that can be made on the login page.
 * Attempts to log a user in by comparing credentials with the database records.
 * Success: Creates a user session and redirects the client to the app page
 * Fail: 400 status code with error message.
 * @precondtion parameters are of appropriate type
 * @param req The Express request object.
 * @param res The Express reponse object.
 */
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
            if(!(await bcrypt.compare(reqData.pass, foundUser.password))) {
                res.status(400).json({ message: "Incorrect password"});
            }
            else { 
                const adminUsers = ['Benji', "Jakob123", "Bernhard"];

                const isAdmin = adminUsers.includes(foundUser.username);
                req.session.user = foundUser.username;

                if (isAdmin) {
                    req.session.isAdmin = true;
                } else {
                    req.session.isAdmin = false; 
                }
                
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