import dotenv from 'dotenv';
dotenv.config();
import express, { json } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import ejs from 'ejs';
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
console.log("file name:- ",__filename);
const __dirname = path.dirname(__filename);
// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// Middlewares:-------------
app.use(cors())
app.use(express.json())
// Serve static files (CSS, images, JS)
app.use(express.static(path.join(__dirname, "public")));

// Routes to handle ejs:----------------------------------------------------------------------------
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


// Search route to handle search requests
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

// API routes to fetch data from TMDB
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

app.listen(PORT, ()=>{
    console.log(`App live at : http://localhost:${PORT}`);
})