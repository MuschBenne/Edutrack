import express, {Response, Request} from "express";
import { Session } from "express-session";
export async function HandleLogout(req: Request, res: Response){
  // TODO: Hantera logout, avsluta sessionen som skapas av express-session och skicka användaren till landing page
  //       Läs på express-session dokumentationen om hur detta görs
  //       https://github.com/expressjs/session?tab=readme-ov-file#sessionregeneratecallback
  req.session.regenerate(() => {
    res.sendStatus(200);
  });
} 