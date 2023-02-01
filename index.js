const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();



app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.7splzic.mongodb.net/?retryWrites=true&w=majority`;
//console.log(uri)

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        const usersCollection = client.db('recipeJar').collection('Users');
        const recipesCollection = client.db('recipeJar').collection('recipes');



        app.post('/users', async (req, res) => {
            const users = req.body
            const result = await usersCollection.insertOne(users)
            res.send(result)
        });


        app.get('/recipes', async (req, res) => {
            const query = {};
            const recipes = await recipesCollection.find(query).toArray()
            res.send(recipes)
        });

        app.get('/recipes/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await recipesCollection.findOne(filter);
            res.send(result);
        });


        app.get('/users/recipes', async (req, res) => {
            const email = req.query.email;
            const query = { userEmail: email};
            const recipes = await recipesCollection.find(query).toArray();
            res.send(recipes);
        });

    }
    finally { }
}
run().catch(console.log);




app.get('/', async (req, res) => {
    res.send('Recipe Jar server is running');
});

app.listen(port, () => console.log(`Recipe Jar server is running on ${port}`));