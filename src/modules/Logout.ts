import express, {Response, Request, NextFunction} from "express";
import { Session } from "express-session";
export async function HandleLogout(req: Request, res: Response, next: NextFunction){
  req.session.regenerate(() => {
    res.redirect("/");
    next();
  });
} 