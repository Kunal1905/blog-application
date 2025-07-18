const express = require("express");
const router = express.Router();
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const Blog = require("../models/blog");
const Comment = require("../models/comment");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve("./public/uploads"));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

router.get("/add-new", (req, res) => {
  return res.render("addBlog", {
    user: req.user,
  });
});

router.post("/", upload.single("coverImage"), async (req, res) => {
  try {
    const { title, body } = req.body;

    let coverImagePath;

    if (req.file) {
      coverImagePath = `/uploads/${req.file.filename}`;
    } else {
      coverImagePath = `/public/uploads/default.png`;
    }

    const blog = await Blog.create({
      body,
      title,
      createdBy: req.user._id,
      coverImage: coverImagePath,
    });

    return res.redirect(`/blog/${blog._id}`);
  } catch (err) {
    console.error("upload error:", err);
    return res.status(500).send("Something went wrong!");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("createdBy")
      .exec();
    if (!blog) {
      return res.status(404).send("Blog not found");
    }
    console.log("Blog ID from DB:", blog._id);
    console.log("Blog ID as string:", blog._id.toString());
    const comments = await Comment.find({ blogId: blog._id })
      .populate("createdBy")
      .exec();
    return res.render("blog", {
      user: req.user,
      blog: blog,
      comments: comments || [],
    });
  } catch (error) {
    console.error("upload error:", error);
    return res.status(500).send("Something went wrong!");
  }
});

router.post("/comment/:blogId", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).send("You must be logged in to comment");
    }
    const blogId = req.params.blogId.trim();
    const { content } = req.body;

    console.log("Received blogId (trimmed):", blogId); 
    console.log("Received content:", content);

    if (!blogId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send("Invalid blog ID: " + blogId);
    }
    const blog = await Blog.findById(blogId).exec();
    if (!blog) {
      return res.status(404).send("Blog not found!");
    }
    const comment = await Comment.create({
      content,
      blogId,
      createdBy: req.user._id,
    });
    console.log("Created comment:", comment);
    return res.redirect(`/blog/${blogId}`);
  } catch (error) {
    console.error("Error creating comment:", error.message, err.stack);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
