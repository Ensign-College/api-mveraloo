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



// Lambda handler function for POST /customers
exports.postCustomer = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { firstName, lastName, phoneNumber } = body;
        const customerKey = `customer:${phoneNumber}`;
        const user = {
            firstName,
            lastName,
            phoneNumber
        };
        await redisClient.json.set(customerKey, '$', user);
        return {
            statusCode: 200,
            body: JSON.stringify(user)
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: 'An Error Occurred'
        };
    }
};

// Lambda handler function for GET /customers/{customerId}
exports.getCustomer = async (event) => {
    try {
        const customerId = event.pathParameters.customerId;
        const key = `customer:${customerId}`;
        const customers = await redisClient.json.get(key, { path: '$' });
        if (customers) {
            return {
                statusCode: 200,
                body: JSON.stringify(customers)
            };
        } else {
            return {
                statusCode: 404,
                body: "Customer not found"
            };
        }
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: 'An Error Occurred'
        };
    }
};

// Lambda handler function for POST /orders
exports.postOrder = async (event) => {
    try {
        const order = JSON.parse(event.body);
        const responseStatus = order.productQuantity && order.ShippingAddress ? 200 : 400;

        if (responseStatus === 200) {
            await addOrder({ redisClient, order });
            return {
                statusCode: responseStatus,
                body: JSON.stringify(order)
            };
        } else {
            return {
                statusCode: responseStatus,
                body: `Missing one of the following fields: ${order.productQuantity ? "" : "productQuantity"} ${order.ShippingAddress ? "" : "ShippingAddress"}`
            };
        }
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: 'Internal Server Error'
        };
    }
};

// Lambda handler function for GET /order/{orderId}
exports.getOrder = async (event) => {
    try {
        const orderId = event.pathParameters.orderId;
        const order = await getOrder({ redisClient, orderId });
        if (order === null) {
            return {
                statusCode: 404,
                body: 'Order not found'
            };
        } else {
            return {
                statusCode: 200,
                body: JSON.stringify(order)
            };
        }
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: 'Internal Server Error'
        };
    }
};

// Lambda handler function for POST /orderItems
exports.postOrderItem = async (event) => {
    try {
        const validate = ajv.compile(Schema);
        const orderItem = JSON.parse(event.body);
        const valid = validate(orderItem);

        if (!valid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid request body' })
            };
        }

        const orderItemId = await addOrderItem({
            redisClient,
            orderItem
        });

        return {
            statusCode: 201,
            body: JSON.stringify({ message: "Order item added successfully" })
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: 'Internal Server Error'
        };
    }
};

// Lambda handler function for GET /orderItems/{orderItemId}
exports.getOrderItem = async (event) => {
    try {
        const orderItemId = event.pathParameters.orderItemId;
        const orderItem = await getOrderItem({ redisClient, orderItemId });

        if (!orderItem) {
            return {
                statusCode: 404,
                body: 'Order item not found'
            };
        } else {
            return {
                statusCode: 200,
                body: JSON.stringify(orderItem)
            };
        }
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: 'Internal Server Error'
        };
    }
};