const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors =require('cors')
const port = process.env.PORT || 8000  

// midle ware
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8dssgfd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri)

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
    const popularcampcollection = client.db("medicaltrail").collection("popularCamp");
    const joincampcollention = client.db("medicaltrail").collection("joincamp");
    const usercollection  = client.db("medicaltrail").collection("users");


// jwt related api
app.post('/jwt', async (req, res) => {
  const user = req.body
  const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '1h',})
  res.send({token})

})




// user related api
 app.post('/users', async (req, res) => {
  const user = req.body;
  // insert email if user doesnt exists: 
  const query = { email: user.email }
  const existingUser = await usercollection.findOne(query);
  if (existingUser) {
    return res.send({ message: 'user already exists', insertedId: null })
  }
  const result = await usercollection.insertOne(user);
  res.send(result);
 }); 

// popular camp info

 app.get('/popularmedicalcamp', async(req,res)=>{
    const result = await popularcampcollection.find().toArray()
    res.send(result)

 })

 app.post('/joincamp', async(req,res)=>{
   const joincampdata = req.body
   console.log(joincampdata)
   const result = await joincampcollention.insertOne(joincampdata)
   res.send(result)
   
 })

 app.patch('/joincampdetails/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };

  const updatedDoc = {
      $inc: { participantCount: 1 } // Increment participantCount by 1
  };

  const result = await popularcampcollection.updateOne(filter, updatedDoc);

  res.send(result);
});





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
  res.send('medtrail server is running')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})