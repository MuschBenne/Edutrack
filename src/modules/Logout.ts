import express, {Response, Request, NextFunction} from "express";
import { Session } from "express-session";
export async function HandleLogout(req: Request, res: Response, next: NextFunction){
  // TODO: Hantera logout, avsluta sessionen som skapas av express-session och skicka användaren till landing page
  //       Läs på express-session dokumentationen om hur detta görs
  //       https://github.com/expressjs/session?tab=readme-ov-file#sessionregeneratecallback
  req.session.regenerate(() => {
    res.redirect("/");
    next();
  });
} 