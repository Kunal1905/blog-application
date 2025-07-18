require("dotenv").config();

const express = require("express")
const path = require("path")
const userRoute = require("./routes/user")
const blogRoute = require("./routes/blog")
const mongoose = require("mongoose")
const cookieParser = require("cookie-parser")
const { checkForAuthenticationCookie } = require("./middleware/authentication")
const Blog = require("./models/blog")  

const app = express()
const PORT = process.env.PORT || 8000;

mongoose.connect(process.env.MONGO_URL)
.then((e) => console.log("MongoDB Connected!"));

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"))


app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"))
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
  });
app.use(express.static(path.resolve("./public")));
app.use(express.urlencoded({extended:true}))
app.use("/user", userRoute);
app.use("/blog", blogRoute);


app.get("/", async (req, res) => {
    try{
        const allBlogs = await Blog.find({})
        console.log("Fetched blogs:", allBlogs);
        res.render("home", {
            user: req.user,
            blogs: allBlogs,
        });
    } catch(error) {
        console.error("Error Fetching Blogs:", error);
        res.status(500).send("Error loading homepage");
    }
})

app.listen(PORT, () =>console.log(`Server Started at PORT:${PORT}`));