const express = require("express")
const User = require("../models/user");
const { createTokenForUser } = require("../services/authentication");
const router = express.Router();

router.get("/signin", (req, res) => {
    res.render("signin")
})

router.get("/signup", (req, res) => {
    res.render("signup")
})

router.get("/logout", (req, res) => {
    res.clearCookie("token").redirect("/")
})

router.post("/signup", async (req, res) => {
    const { fullName, email, password} = req.body;
    await User.create({
        fullName,
        email,
        password,
    })
    res.redirect("/")
})

router.post("/signin", async (req, res) => {
    const {email, password} = req.body;
    try{
        const user = await User.matchPasswordAndGenerateToken(email, password);
        const token = createTokenForUser(user);
        return res.cookie("token", token).redirect("/")
    } catch(error) {
        return res.render("signin", {error})
    }
})
module.exports = router;