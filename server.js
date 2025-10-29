import dotenv from 'dotenv';
dotenv.config();
import express, { json } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// Set view engine
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// Middlewares:-------------
app.use(cors())
app.use(express.json())
// Serve static files (CSS, images, JS)
app.use(express.static(path.join(__dirname, "public")));

// Routes to handle ejs:--------------------------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.render("home", { title: "Home | PixelatedMovi" });
});
app.get("/about", (req, res) => {
  res.render("about", { title: "About | PixelatedMovi" });
});
app.get("/trending", (req, res) => {
  res.render("trending", { title: "Trending | PixelatedMovi" });
});
app.get("/latest", (req, res) => {
  res.render("latest", { title: "Latest | PixelatedMovi" });
});
app.get("/player", (req, res) => {
  res.render("player", { title: "Player | PixelatedMovi" });
});


// Search route to handle search requests:-----------------------------------------------------------------------------
app.post("/search", async (req, res)=>{
    try{
        const searchVal = req.body.Search;     // console.log("searched value: ", searchVal);
        const response = await fetch(`https://www.omdbapi.com/?s=${searchVal}&apikey=${process.env.OMDB_KEY}`)
        const data = await response.json();     // console.log("OMDB data: ", data);
        res.status(200).json({status: "success", searched: searchVal, omdb: data})
    } catch(error){
        console.log("Error in /search route:", error);
        res.status(500).json({status:"error", message: "Internal Server Error"});
    }
    
})

// API routes to fetch data from TMDB:--------------------------------------------------------------------------------
app.get("/api/trending", async (req, res)=>{
    try{
        const page=req.query.page || 1;
        const response = await fetch(`https://temp-tmdb-proxy.vercel.app/tmdb/trending?page=${page}`);
        const data = await response.json();
        res.status(200).json({status: "success", data: data});
    } catch(error){
        console.log("Error in /api/trending route:", error);
        res.status(500).json({status:"error", message: "Internal Server Error"});
    }
});



// MongoDB Setup : ----------------------------------------------------------------------------------------------
import User from "./models/user.js";

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.error("❌ MongoDB connection failed:", err));


// Temporary auth simulation (until real login system)
app.use((req, res, next) => {
    // For now, assume user is NOT logged in
    req.userId = "guest";

    // Later, when you implement login, you’ll replace this with actual session or JWT check.
    // Example: req.userId = req.session.userId || null;
    next();
});


app.get("/api/bookmarks/test", (req, res) => {
    res.json({ message: "MongoDB route working fine" });
});

// Route to Get Bookmarks from MongoDB
app.get("/api/bookmarks/get", async (req,res)=>{
    if (!req.userId) return res.status(401).json({ error: "Not logged in" });
    try{
        const user = await User.findOne({ userId: req.userId }); // temporary guest
        if (!user) return res.status(404).json({ error: "User not found" });
        res.status(200).json({ bookmarks: user.bookmarks });
    } catch(error){
        console.log("Error in /api/bookmarks/get route:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Route to Save Bookmarks to MongoDB
app.post("/api/bookmarks/save", async (req,res)=>{
    if (!req.userId) return res.status(401).json({ error: "Not logged in" });
    try{
        const { tmdbId, mediaType, title, poster, year } = req.body;
        const user = await User.findOne({ userId: req.userId }); // find user 
        const exists = user.bookmarks.some(b => b.tmdbId === tmdbId); // check if bookmark exists
        if (!exists) {
            user.bookmarks.push({ tmdbId, mediaType, title, poster, year });
            await user.save();
        }
        res.status(200).json({ message: "Bookmark saved", bookmark: { tmdbId, mediaType, title, poster, year } });
    } catch(error){
        console.log("Error in /api/bookmarks route: ", error)
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Route to Delete Bookmarks from MongoDB
app.delete("/api/bookmarks/delete/:tmdbId", async (req,res)=>{
    if (!req.userId) return res.status(401).json({ error: "Not logged in" });
    try{
        const { tmdbId } = req.params;
        const user = await User.findOne({ userId: req.userId }); // temporary guest
        user.bookmarks = user.bookmarks.filter(b => b.tmdbId !== tmdbId);
        await user.save();
        res.status(200).json({ message: "Bookmark deleted" });
    } catch(error){
        console.log("Error in /api/bookmarks/delete route:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});







// Starting the server:---------------------------------------------------------------------------------------------
app.listen(PORT, ()=>{
    console.log(`App live at : http://localhost:${PORT}`);
})