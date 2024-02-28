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
//New
const {addOrder,getOrder} = require("./services/orderservice.js"); //import the add order funcion from the orderItems.js file
const {addOrderItem, getOrderItem} = require("./services/orderItems"); //import the addorderitem function from the orderItems.js file
const fs = require("fs"); //import the file system library
const Schema = JSON.parse(fs.readFileSyncI("./orderItemSchema.json", "utf8")); //read the orderitemschema.json fileand parse it with JSON
const Ajv =require("ajv"); //import the ajv library
const ajv = new Ajv(); //create an ajv object to validate JSON



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

app.post('/customer', async (req, res) => { //async means we will await promises
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

//Assignments 
// Endpoint POST requests to save customer data
app.post('/customers', async (req, res) => {
    try {
        // Extract data from request body
        const { firstName, lastName, phoneNumber } = req.body;
        // Data id
        const customerKey = `customer:${phoneNumber}`;
        // Store in Redis
        const user = {
            firstName,
            lastName,
            phoneNumber
        }
        // Store data in Redis
        await redisClient.json.set(customerKey,'$', user);
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).send('An Error Occurred');
        return;
    }

});
app.get('/customers', async (req,res)=>{
    try {
        const customerKeys = await redisClient.keys('customer:*');
        const customers = await Promise.all(customerKeys.map(async (key)=>{
            const customers = await redisClient.json.get(key, { path: '$' });
            return customers;
        }));
        res.json(customers);


        //const customerId =req.params.customerId;
        //const key = `customer:${customerId}`;
        // Retrieve customer data from Redis
        
    } catch (error) {
        console.error(error);
        res.status(500).send('An Error Occurred');
    }
  }); 




app.post('/orders', async (req, res) => {
    try {
        let order = req.body;
        // order details

        let responseStatus;
        if (order.productQuantity && order.ShippingAddress) {
            responseStatus = 200;
        } else {
            responseStatus = 400;
        }

        if (responseStatus === 200) {
            // Add order to database or perform other operations
            await addOrder({ redisClient, order });
            res.status(200).send('Order added successfully');
        } else {
            res.status(responseStatus).send(`Missing required fields: ${
                order.productQuantity ? "" : "productQuantity"
            }, ${
                order.ShippingAddress ? "" : "ShippingAddress"
            }`);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get("/order/:orderId", async (req, res) => {
    //get the order from the database
    const orderId = req.params.orderId;
    let order = await getOrder({ redisClient, orderId });
    if (order === null) {
        res.status(404).send('Order not found ');
    } else {
        res.json(order);
    }
})

app.post("/orderItems", async (req, res) => {
    try {
        console.log("Schema", Schema);
        const validate = ajv.compile(Schema);
        const valid = validate(req.body);
        if (!valid) {
            return res.status(400).json({ error:'Invalid request bodty '});
        } 
        console.log("Request Body:", req.body);
        //calling addOrderItem function and storing the result
        const orderItemId = await addOrderItem({
            redisClient,
            orderItem: req.body,
        });
        //responding with the result
        res
            .status(201)
            .json({orderItemId, message: "Order item added successfully"});
    } catch (error) {
        console.error("Error adding order item:", error);
        res.status(500).json({ error:'Internal Server Error '});
    }
});

app.get("/orderItems/:orderItemId", async (req, res) => {
    try {
        //get the order from the database
        const orderItemId = req.params.orderItemId;
        const orderItem = await getOrderItem({ redisClient, orderItemId});
        res.json(orderItem);
    } catch (error) {
        console.error("Error adding order item:", error);
        res.status(500).json({ error:'Internal Server Error '});
    }
})
console.log("Hello");
