import dotenv from 'dotenv';
dotenv.config();
import express, { json } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors())
app.use(express.json())

app.post("/search", async (req, res)=>{
    try{
        const searchVal = req.body.Search;     // console.log("searched value: ", searchVal);

        const response = await fetch(`https://www.omdbapi.com/?s=${searchVal}&apikey=${process.env.OMDB_KEY}`)
        const data = await response.json();     // console.log("OMDB data: ", data);

        res.json({status: "success", searched: searchVal, omdb: data})
    } catch(error){
        console.log("Error in /search route:", error);
        res.status(500).json({status:"error", message: "Internal Server Error"});
    }
    
})


app.listen(PORT, ()=>{
    console.log(`App live at : http://localhost:${PORT}`);
})