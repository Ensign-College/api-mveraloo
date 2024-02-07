// import is better than require. it is another way to import succesfully.
// import express from 'express';
// Express makes API's - connect frontend to database.
const express = require('express');
const cors = require('cors');

const options = {
    origin:'http://localhost:3000' //allow our frontend to call this backend
}
const Redis = require('redis');//import the redis library
const bodyParser = require('body-parser'); //import the body parser
//import express from 'express'
const redisClient = Redis.createClient({
    url:`redis://localhost:6379`
});


const app = express(); //create an express application
const port = 3001; //port number


app.use(bodyParser.json()); //user bodyparser
app.use(cors(options)); //allow frontend to call backend 

app.listen(port, ()=>{
    redisClient.connect(); //it connects to the database
    console.log(`API is Listening on port: ${port}`);
}); //listen for web requests from the frondend and don't stop.

//http://localhost:3000/boxes
app.post('/boxes', async (req, res) => { //async means we will await promises
        const newBox = req.body;
        newBox.id = parseInt(await redisClient.json.arrLen('boxes', '$')) +1; //the user shouldn't choose the ID!
        await redisClient.json.arrAppend('boxes', '$',newBox); //saves the JSON in redis
        res.json(newBox); //respond with the new box

});

//1 parameter = URL
//2 - a function to return boxes
//req= the request from the user/browser
//res= the response to the browser
//async before the arrow so i can make promises
app.get('/boxes', async (req,res)=>{
    let boxes = await redisClient.json.get('boxes',{path: '$'}); //get the boxes 
    
    //send the boxes to the browser
    res.json(boxes[0]); // the boxes is an array of arrays, convert first element to a JSON string
}); //return boxes to the user


console.log("Hello");