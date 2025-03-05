import express, {Response, Request, NextFunction} from "express";
import { Session } from "express-session";

/**
 * Router function for GET-requests for the route /app/*
 * @param req The Express request object.
 * @param res The Express reponse object.
 * @param next A callback function used to pass control to the next middleware function in the Express pipeline.
 */
export async function HandleLogout(req: Request, res: Response, next: NextFunction){
  req.session.regenerate(() => {
    res.redirect("/");
    next();
  });
} 