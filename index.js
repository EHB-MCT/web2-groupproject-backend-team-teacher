const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const cors = require('cors');

//Create the mongo client to use
const client = new MongoClient(process.env.MONGO_URL);

const app = express();
//Let heroku do its thing with the port
const port = process.env.PORT || 1337;

app.use(express.static('public'));
app.use(bodyParser.json());
// Floodgates OPEN!
app.use(cors());


//Root route
app.get('/', (req, res) => {
    res.status(300).redirect('/info.html');
});

// DONE - Return all challenges from the database
app.get('/challenges', async (req, res) =>{

    try{
         //connect to the db
        await client.connect();

         //retrieve the challenges collection data
        const colli = client.db('groupproject').collection('challenges');
        const chs = await colli.find({}).toArray();

         //Send back the data with the response
        res.status(200).send(chs);
    }catch(error){
        console.log(error)
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        });
    }finally {
        await client.close();
    }

    
});

// DONE - challenges/:id
app.get('/challenges/:id', async (req,res) => {
    //id is located in the params: req.params.id
    try{
         //connect to the db    
        await client.connect();

         //retrieve the boardgame collection data
        const colli = client.db('groupproject').collection('challenges');

         //only look for a challenge with this ID
        const query = { _id: ObjectId(req.params.id) };
        
        const challenge = await colli.findOne(query);

        if(challenge){
             //Send back the file
            res.status(200).send(challenge);
            return;
        }else{
            res.status(400).send('Challenge could not be found with id: ' + req.params.id);
        }
      
    }catch(error){
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        });
    }finally {
        await client.close();
    }
});

//DONE - save a challenge
app.post('/challenges', async (req, res) => {

    if(!req.body.name || !req.body.course || !req.body.points){
        res.status(400).send('Bad request: missing name, course or points');
        return;
    }

    try{
         //connect to the db
        await client.connect();

         //retrieve the challenges collection data
        const colli = client.db('groupproject').collection('challenges');

         // Validation for double challenges
        const bg = await colli.findOne({name: req.body.name, course: req.body.course});
        if(bg){
            res.status(400).send(`Bad request: Challenge already exists with name ${req.body.name} for course ${req.body.course}` );
            return;
        } 
         // Create the new Challenge object
        let newChallenge = {
            name: req.body.name,
            course: req.body.course,
            points: req.body.points,
        }
        // Add the optional session field
        if(req.body.session){
            newChallenge.session = req.body.session;
        }
        
         // Insert into the database
        let insertResult = await colli.insertOne(newChallenge);

         //Send back successmessage
        res.status(201).json(newChallenge);
        return;
    }catch(error){
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        });
    }finally {
        await client.close();
    }
});

//DONE - update a challenge
app.put('/challenges/:id', async (req,res) => {
    //Check for body data
    if(!req.body.name || !req.body.course || !req.body.points){
        res.status(400).send({
            error: 'Bad Request',
            value: 'Missing name, course or points property'
        });
        return;
    }
    // Check for id in url
    if(!req.params.id){
        res.status(400).send({
            error: 'Bad Request',
            value: 'Missing id in url'
        });
        return;
    }

    try{
         //connect to the db
        await client.connect();

         //retrieve the challenges collection data
        const colli = client.db('groupproject').collection('challenges');

         // Validation for existing challenge
        const bg = await colli.findOne({_id: ObjectId(req.params.id)});
        if(!bg){
            res.status(400).send({
                error: 'Bad Request',
                value: `Challenge does not exist with id ${req.params.id}`
            });
            return;
        } 
         // Create the new Challenge object
        let newChallenge = {
            name: req.body.name,
            course: req.body.course,
            points: req.body.points,
        }
        // Add the optional session field
        if(req.body.session){
            newChallenge.session = req.body.session;
        }
        
         // Insert into the database
        let updateResult = await colli.updateOne({_id: ObjectId(req.params.id)}, 
        {$set: newChallenge});;

         //Send back successmessage
        res.status(201).json(updateResult);
        return;
    }catch(error){
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        });
    }finally {
        await client.close();
    }
});

//delete a challenge
app.delete('/challenges/:id', async (req,res) => {
    
    if(!req.params.id){
        res.status(400).send({
            error: 'Bad Request',
            value: 'No id available in url'
        });
        return;
    }

    try{
         //connect to the db
        await client.connect();

         //retrieve the challenges collection data
        const colli = client.db('groupproject').collection('challenges');

         // Validation for double challenges
        let result = await colli.deleteOne({_id: ObjectId(req.params.id)});
         //Send back successmessage
        res.status(201).json(result);
        return;
    }catch(error){
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        });
    }finally {
        await client.close();
    }
});



app.listen(port, () => {
    console.log(`API is running at http://localhost:${port}`);
})