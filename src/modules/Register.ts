import User from "../db_models/User";

export async function HandleRegister(req, res){
    const newUser = new User({
        username: "Benji"
      });
    
      await newUser.save().then(() => {
        if(User.findById({username: "Benji"}))
          res.send("Name already registered");
        else
          res.send("Success!");
      })
}