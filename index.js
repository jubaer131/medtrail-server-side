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
    const addcampcollection  = client.db("medicaltrail").collection("addcamp");
    


// jwt related api
app.post('/jwt', async (req, res) => {
  const user = req.body
  const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET_API, {
    expiresIn: '1h',})
    console.log(token)
  res.send({token})

})

// midleware for varify token 
const verifyToken = (req, res, next) => {
  console.log('inside verify token', req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_API, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.decoded = decoded;
    console.log(decoded)
    next();
  })
}

// use verify admin after verifyToken
const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email;
  const query = { email: email };
  const user = await usercollection.findOne(query);
  const isAdmin = user?.role === 'admin';
  if (!isAdmin) {
    return res.status(403).send({ message: 'forbidden access' });
  }
  next();
}




// user related api

app.get('/user/:email', async (req, res) => {
  const email = req.params.email
  const result = await usercollection.findOne({ email })
  res.send(result)
}) 



app.post('/users', async (req, res) => {
  const user = req.body;
  // insert email if user doesnt exists: 
  // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
  const query = { email: user.email }
  const existingUser = await usercollection.findOne(query);
  if (existingUser) {
    return res.send({ message: 'user already exists', insertedId: null })
  }
  const result = await usercollection.insertOne(user);
  res.send(result);
});

// admin related api
app.post('/addacamp',verifyToken,verifyAdmin, async(req,res)=>{
  const addcamp =req.body
  const result = await addcampcollection.insertOne(addcamp)
  res.send(result)
})




// popular camp info

 app.get('/popularmedicalcamp', async(req,res)=>{
    const result = await popularcampcollection.find().toArray()
    res.send(result)

 })

 app.post('/joincamp', async(req,res)=>{
   const joincampdata = req.body
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


// app.get('/availablecamp', async (req, res) => {
//   const search = req.query.search;
//   let query = {};

//   if (search) {
//     query = {
//       CampName: { $regex: search, $options: 'i' } // Case-insensitive search
//     };
//   }
//   const result = await addcampcollection.find(query).sort({ CampName: 1 }).toArray();
//     res.send(result);
 
// });

app.get('/availablecamp', async (req, res) => {
  const search = req.query.search;
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1; // Default to ascending if no sortOrder is provided
  let query = {};

  if (search) {
    query = {
      CampName: { $regex: search, $options: 'i' } // Case-insensitive search
    };
  }
  
  const result = await addcampcollection.find(query).sort({ CampName: sortOrder }).toArray();
    res.send(result);
});




app.post('/saveavailablecamp', async(req,res)=>{
  const availablecampdata = req.body
  const result = await joincampcollention.insertOne(availablecampdata)
  res.send(result)
  
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
  res.send('medtrail server is running')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})