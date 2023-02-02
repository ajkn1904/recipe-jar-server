const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();
const jwt = require('jsonwebtoken')


app.use(cors());
app.use(express.json());


const verifyJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthorized access');
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {
        if (error) {
            return res.send(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.7splzic.mongodb.net/?retryWrites=true&w=majority`;
//console.log(uri)

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        const usersCollection = client.db('recipeJar').collection('Users');
        const recipesCollection = client.db('recipeJar').collection('recipes');



        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query)
            console.log(user);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
                    expiresIn: '1d'
                })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        })



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


        app.get('/recentRecipes', async (req, res) => {
            const query = {};
          const cursor = recipesCollection.find(query);
          const newRecipe = await cursor.sort({_id:-1}).limit(3).toArray();
          res.send(newRecipe);
        });


        app.get('/users/recipes', verifyJwt, async (req, res) => {
            const email = req.query.email;
            const query = { userEmail: email };
            const recipes = await recipesCollection.find(query).toArray();
            res.send(recipes);
        });



        app.put('/users/recipes/:id', verifyJwt, async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const query = { _id: ObjectId(id) };
            const option = {
                upsert: true
            }
            const updatedDoc = {
                $set: {
                    name: data.name,
                    ingredients: data.ingredients,
                    cooking_description: data.cooking_description,
                    status: data.status
                }
            }
            const result = await recipesCollection.updateOne(query, updatedDoc, option);
            res.send(result);
        });





        app.post('/users/recipes', verifyJwt, async (req, res) => {
            const recipe = req.body;
            const result = await recipesCollection.insertOne(recipe);
            res.send(recipe);
        });



        app.delete('/users/recipes/:id', verifyJwt, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await recipesCollection.deleteOne(query);
            res.send(result);
        });


        
    }
    finally { }
}

run().catch(console.log);




app.get('/', async (req, res) => {
    res.send('Recipe Jar server is running');
});

app.listen(port, () => console.log(`Recipe Jar server is running on ${port}`));