// import is better than require. it is another way to import succesfully.
// import express from 'express';
// Express makes API's - connect fronend to database.
const express = require('express');
const app = express(); //create an express application
app.listen(3000); //listen for web requests from the frondend and don't stop.

const boxes = [
    {boxId:1},
    {boxId:2},
    {boxId:3},
    {boxId:4}
];
//1 parameter = URL
//2 - a function to return boxes
//req= the request from the browser
//res= the response to the browser
app.get('/boxes', (req,res)=>{
    //send the boxes to the browser
    res.send(JSON.stringify(boxes)); // convert boxes to a string
}); //return boxes to the user
console.log("Hello");