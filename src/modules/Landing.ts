import { Request, Response } from "express";
import User from "../db_models/User";

export async function HandleLanding(req: Request, res: Response){
    res.send("Hello world");
}