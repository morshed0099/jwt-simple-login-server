const { promisify } = require('util')
const express = require('express')
const jwt = require('jsonwebtoken')
const app = express()
const port = process.env.PORT || 5000
const cors = require('cors')

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1m4kiwj.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const userCollection = client.db('SimpleLogin').collection('users');

const verifyToken = async (req, res, next) => {
    const token = req.headers?.authorization?.split(' ')[1]  
    if (!token) {
        res.send('please login first')
    }   

    const decoded = await promisify(jwt.verify)(token, process.env.SECRET_TOKEN);
    req.user = decoded
    next();

}
const genarateToken = (userInfo) => {
    const payload = {
        email: userInfo.email,
    }
    const token = jwt.sign(payload, process.env.SECRET_TOKEN, { expiresIn: "10s" });
    return token;
}

async function run() {
    try {

        app.post('/user', async (req, res) => {
            const users = req.body;
            const email = users.email
            const allUser = await userCollection.find({}).toArray()
            const match = allUser.filter(user => user.email === email)
            if (match.length) {
                return res.send({ message: "email alredy exist" })
            }
            const result = await userCollection.insertOne(users)
            res.send(result);

        })
        app.post('/login', async (req, res) => {
            const users = req.body
            const query = {
                email: users.email,
                password: users.password
            }
            const user = await userCollection.findOne(query)

            if (!user) {
                return res.send({ message: "please check your email and passwod" })
            }
            const token = genarateToken(user)
            const data = {
                user,
                token,
            }
            res.send(data);


        })
        app.post('/me', verifyToken, async (req, res) => {
            const user = req.user
            const email = user?.email
            const query = {
                email: email
            }
            const result = await userCollection.findOne(query)   
            console.log(result,'line 89')  ;      
            res.send(result);
        })
    } finally {

    }

} run().catch(error => console.error(error))



app.get('/', (req, res) => {
    res.send('server is running')
})

app.listen(port, () => {
    console.log('server is running on port ');
})