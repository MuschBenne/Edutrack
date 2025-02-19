import express from 'express';
import mongoose from 'mongoose';
import User from './db_models/User';
import { HandleRegister } from './modules/Register';
import { HandleLogin } from './modules/Login';
import { HandleLanding } from './modules/Landing';
import { HandleLogout } from './modules/Logout';
import { HandleApp } from './modules/Application';

mongoose.connect("mongodb://127.0.0.1:27017")
const app = express();
const port = 3000;

/**
 * Landing page
 */
app.get('/', (req, res) => {
  HandleLanding(req, res);
});

/**
 * Handle register
 */
app.get("/register", async (req, res) => {
  HandleRegister(req, res);
});

/**
 * Handle login
 */
app.get("/login", async (req, res) => {
  HandleLogin(req, res);
});

/**
 * Handle logout
 */
app.get("/logout", async (req, res) => {
  HandleLogout(req, res);
});

/**
 * Handle app
 */
app.get("/app", async (req, res) => {
  HandleApp(req, res);
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}\nUse Ctrl + C to stop the server...`);
});
