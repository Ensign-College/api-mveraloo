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
    url:`redis://${process.env.REDIS_HOST}:6379`
});
//New
const {addOrder,getOrder} = require("./services/orderservice.js"); //import the add order funcion from the orderItems.js file
const {addOrderItem, getOrderItem} = require("./services/orderItems"); //import the addorderitem function from the orderItems.js file
const fs = require("fs"); //import the file system library
const Schema = JSON.parse(fs.readFileSync("./services/orderItemSchema.json", "utf8")); //read the orderitemschema.json file and parse it with JSON
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
app.get('/customers/:customerId', async (req,res)=>{
    try {
        const customerId =req.params.customerId;
        const key = `customer:${customerId}`;
        // Retrieve customer data from Redis
        const customers = await redisClient.json.get(key, { path: '$' }); 
        if (customers) {
            res.json(customers);
        
        } else {
            res.status(404).send("Customer not found");
        } 
    } catch (error) {
        console.error(error);
        res.status(500).send('An Error Occurred');
    }
  }); 

        


app.post('/orders', async (req, res) => {
    let order= req.body;

    let responseStatus = 
    order.productQuantity && order.ShippingAddress ? 200 : 400;
    
    
    if (responseStatus === 200) {
        try {
            await addOrder({ redisClient, order });
            res.status(responseStatus).json(
                order
            )
        }
        catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error ');
        }
    } else {
        res.status(responseStatus);
        res.send(
            `Mising one of the following fiels: ${
                order.productQuantity ? "" : "productQuantity"
            }  ${order.ShippingAddress ? "" : "ShippingAddress"}`
            );
        // res.status(responseStatus).send();
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
        res.status(201).json({message: "Order item added successfully"});
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