
const express = require('express');
var jwt = require('jsonwebtoken');
const app = express()
const cors = require('cors');
const cookieParser = require('cookie-parser')
require('dotenv').config()
const port = process.env.PORT || 5000;


//middleware
app.use(cors({
    origin: ['http://localhost:5173', 'https://assignment-eleven-6975c.web.app', 'https://assignment-eleven-6975c.firebaseapp.com'],
    credentials: true,
    optionsSuccessStatus: 200,
}));
app.use(express.json());
app.use(cookieParser())


const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;
    // console.log(token)
    if (!token) {
        // console.log('why me bro')
        return res.status(401).send({ message: 'Unauthorized Access' })
    }
    if (token) {
        jwt.verify(token, process.env.ACXESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                // console.log('why me bro')
                return res.status(401).send({ message: 'Unauthorized Access' })
            }
            // console.log(decoded)
            req.user = decoded;

            next();
        })
    }

}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.insvee7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const queryCollection = client.db("AlternativeProducts").collection("queries");
        const recommendationCollection = client.db("AlternativeProducts").collection("recommendation");


        //jwt
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            // console.log(user);
            const token = jwt.sign(user, process.env.ACXESS_TOKEN_SECRET, { expiresIn: '365d' });
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            }).send({ success: true })
        })

        //clear token at logout

        app.get('/logOut', (req, res) => {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                maxAge: 0
            }).send({ success: true })
        })

        app.post('/queries', async (req, res) => {
            const queryData = req.body;
            const result = await queryCollection.insertOne(queryData);
            res.send(result);
        })

        app.post('/recommendation', async (req, res) => {
            const recommendationData = req.body;
            const result = await recommendationCollection.insertOne(recommendationData);
            res.send(result);
        })

        app.get('/queries', async (req, res) => {
            const result = await queryCollection.find().sort({ _id: -1 }).toArray();
            res.send(result);
        })

        app.get('/queries/:email', verifyToken, async (req, res) => {
            const tokenEmail = req.user.email;
            // console.log('from verify = ', tokenData)

            const email = req.params.email;
            if (tokenEmail !== email) {
                // console.log('i ma in')
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            const query = { email }
            const result = await queryCollection.find(query, { sort: { _id: -1 } }).toArray();
            res.send(result);
        })

        app.get('/query/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await queryCollection.findOne(query);
            res.send(result);
        })

        app.get('/query-recommendation/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { queryId: id };
            const result = await recommendationCollection.find(filter).toArray();
            res.send(result);
        })


        app.get('/my-recommendation/:email', verifyToken, async (req, res) => {

            const tokenEmail = req.user.email;
            // console.log('from verify = ', tokenData)

            const email = req.params.email;
            if (tokenEmail !== email) {
                // console.log('i ma in')
                return res.status(403).send({ message: 'Forbidden Access' })
            }

            // console.log(req.user.email)
            // console.log(email)
            const query = { RecommendationEmail: email };
            const result = await recommendationCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/recommendation-for-me/:email', verifyToken, async (req, res) => {

            const tokenEmail = req.user.email;
            // console.log('from verify = ', tokenData)

            const email = req.params.email;
            if (tokenEmail !== email) {
                // console.log('i ma in')
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            const query = { queryEmail: email };
            const result = await recommendationCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/recent-six', async (req, res) => {
            const result = await queryCollection.find().sort({ _id: -1 }).limit(6).toArray();
            res.send(result);
        })

        app.put('/update-query/:id', async (req, res) => {
            const id = req.params.id;
            const udeatedData = req.body;
            // console.log(udeatedData)
            const options = { upsert: true };
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    ProductName: udeatedData.ProductName,
                    ProductBrand: udeatedData.ProductBrand,
                    ProductImage: udeatedData.ProductImage,
                    QueryTItle: udeatedData.QueryTItle,
                    BoycottingReason: udeatedData.BoycottingReason,

                },
            };
            const result = await queryCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })

        app.patch('/recommendation/:id', async (req, res) => {
            const id = req.params.id;

            const filter = { _id: new ObjectId(id) };
            const update = { $inc: { recommendationCount: 1 } };
            const result = await queryCollection.updateOne(filter, update);
            res.send(result);
        })

        app.patch('/recommendation-decrease/:id', async (req, res) => {
            const id = req.params.id;

            const filter = { _id: new ObjectId(id) };
            const update = { $inc: { recommendationCount: -1 } };
            const result = await queryCollection.updateOne(filter, update);
            res.send(result);
        })

        app.delete('/delete-query/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await queryCollection.deleteOne(query);
            res.send(result);
        })

        app.delete('/deleteRecommendation/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await recommendationCollection.deleteOne(query);
            res.send(result);
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Alternative Product System....!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})