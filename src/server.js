
const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const path = require('path');







// our first Route





app.use(express.json());
app.use(express.urlencoded({extended: false})); 
app.use('/images', express.static(path.join(__dirname, '../assets')))


app.get('/api/products', async (req, res) => {

 try  { const client = MongoClient.connect(
      'mongodb://localhost:27017',
      { useUnifiedTopology: true });
 

      const db = (await client).db('vue-db');
      const products = await db.collection('products').find({}).toArray();
      res.status(200).json(products);

  } catch(e) {
      console.log(e);
    }

})

app.get('/api/users/:userId/cart', async (req, res) => {
try{   const { userId } = req.params
   const client = MongoClient.connect("mongodb://localhost:27017/vue-db", {
     
      useUnifiedTopology: true

   })
   const db = (await client).db('vue-db');
   const user = await db.collection('users').findOne({ id: userId })
   if (!user) return res.status(404).json('Could not find User')
   const products = await db.collection('products').find({}).toArray();
   const cartItemsIds = user.cartItems;
   const cartItems = cartItemsIds.map(id => products.find(product => product.id === id))

   res.status(200).json(cartItems)
  
}catch(e) {
   console.log(e);
 }
})

app.get('/api/products/:productId', async (req, res) => {
   const { productId } = req.params
   const client = MongoClient.connect("mongodb://localhost:27017/vue-db", {
  
      useUnifiedTopology: true
   })

   const db = (await client).db('vue-db');
   const product = await db.collection('products').findOne({ id: productId })
   if (product) {
      res.status(200).json(product);
   }
   else {
      res.status(404).json('Could not find the product!');
   }
   
})

app.post('/api/users/:userId/cart', async (req, res) => {
   const { userId } = req.params;
   const { productId } = req.body;

   const client = await MongoClient.connect(
     'mongodb://localhost:27017',
     { useNewUrlParser: true, useUnifiedTopology: true },
   );
   const db =await client.db('vue-db');
  await db.collection('users').updateOne({ id: userId }, {
     $addToSet: { cartItems: productId },
     
   });
   
 
   const user = await db.collection('users').findOne({ id: userId });
   const cartItemIds = user.cartItems;
   const products = await db.collection('products').find({}).toArray();
   const cartItems = cartItemIds.map(id =>
     products.find(product => product.id === id));
    
   res.status(200).json(cartItems);
  
 }); 


app.delete('/api/users/:userId/cart/:productId', async (req, res) => {
   const { userId, productId } = req.params;
   const client = MongoClient.connect(
      'mongodb://localhost:27017',
      { UseNewUrlParser: true, useUnifiedTopology: true });
   const db = (await client).db('vue-db');
   await db.collection('users').updateOne({ id: userId }, {
      $pull: { cartItems: productId },
   })
   const user = await db.collection('users').findOne({ id: userId })
   const cartItemsIds = user.cartItems;
   const products = await db.collection('products').find({}).toArray();
   const cartItems = cartItemsIds.map(id => 
      products.find(product => product.id === id))
   res.status(200).json(cartItems)
  
})
app.listen(8000, () => console.log('My first app listening on port 8000! '));
