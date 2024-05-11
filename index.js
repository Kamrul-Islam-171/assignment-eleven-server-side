
const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;


//middleware
app.use(cors({
    origin: ['http://localhost:5173',]
}));
app.use(express.json());



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
        await client.connect();

        const queryCollection = client.db("AlternativeProducts").collection("queries");
        const recommendationCollection = client.db("AlternativeProducts").collection("recommendation");

        app.post('/queries', async (req, res) => {
            const queryData = req.body;
            const result = await queryCollection.insertOne(queryData);
            res.send(result);
        })

        app.post('/recommendation', async(req, res) => {
            const recommendationData = req.body;
            const result = await recommendationCollection.insertOne(recommendationData);
            res.send(result);
        })

        app.get('/queries', async (req, res) => {
            const result = await queryCollection.find().sort({_id: -1}).toArray();
            res.send(result);
        })

        app.get('/queries/:email', async (req, res) => {
            const email = req.params.email;
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

        app.delete('/delete-query/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await queryCollection.deleteOne(query);
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