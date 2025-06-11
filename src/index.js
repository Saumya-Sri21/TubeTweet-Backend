import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{

    app.get('/',(req,res)=>{
        res.send("Hello Saumya")
    })
    app.listen(process.env.PORT || 3000,()=>{
        console.log(`The Server is listening at http://localhost:${process.env.PORT}`)
        
    })
})
.catch((err)=>{
    console.log(`\n MongoDB Connection Failed!!!`)
    
})
