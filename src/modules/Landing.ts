import { Request, Response } from "express";

export async function HandleLanding(req: Request, res: Response){
    // TODO: Skapa en kul landing page, alltså: vad ska man se när man först går in på hemsidan localhost:3000
    // Mesta av sidan kan göras i viewen "Landing.ejs"
    res.render("Landing");
}