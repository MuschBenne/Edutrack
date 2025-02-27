import { Request, Response } from "express";

export async function HandleLanding(req: Request, res: Response){
    res.render("Landing");
}