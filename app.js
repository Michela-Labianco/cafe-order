const express = require('express');
//import the express framework to handle server routes and middleware
const mongoose = require('mongoose');
//connect to mongoose and interact with database
const path = require('path');
//node.js buil-in module to handel file paths correctly across operating systems


const app = express();
//create an instance of express application

const Item = require('./models/item.models').Item;


// Connect to MongoDB (database)
mongoose.connect('mongodb://localhost:27017/menu')
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

app.use(express.urlencoded({ extended: true })); // For parsing data from POST request (forms)
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
//to tell express to use ejs as the template engine -> allow to render .ejs files from views/ folder

app.set('views', path.join(__dirname, 'views')); //it explicity sets the path where EJS template are located
//__dirname is a built-in variable in Node.js that gives the absolute path of the directory containing the current JavaScript file

app.use(express.json()); // to parse JSON data sent in POST requests (useful for AJAX requests)


// Routes
//to show the contact-list if there is at least 1 contact in the database
app.get('/', async (req, res) => {
  try {
    //So the button only shows after a contact is successfully stored in your database (number more than 0)
    const count = await Item.countDocuments(); // Count how many items are in the DB
    res.render('index', { showItemsList: count > 0 }); // pass the variable to EJS
  } catch (err) {
    console.error('Error counting items:', err);
    res.render('index', { showItemsList: false }); // fallback in case of error
  }
});

//HANDLING FORM SUBMISSION
//to store submitted form data in MongoDB
app.post('/submit', async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const newItem = new Item({ name, description, price });
    await newItem.save(); //inserting data by saving new contacts
    //this is what works with fetch in script.js
    res.status(200).json({ message: 'item saved successfully'});
  } catch (err) {
    console.error('Failed to save item:', err);
    res.status(500).send('Server Error');
  }
});

// to display the contact list page
//creating a route to fetch all contacts from mongoDB
app.get('/items-list', async (req, res) => {
  try {
    const items = await Item.find(); // Fetch all contacts from DB
    res.render('items-list', { items }); // Pass contacts to EJS and show the contact book page
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).send('Server Error');
  }
});

//delete
app.delete('/delete-item/:id', async(req, res) =>{
  try{
    const deletedItem = await Item.findByIdAndDelete(req.params.id); //to find the id
    if (!deletedItem) {
      return res.status(404).send('Item not found');
    }
    
    //res.redirect('/contact-list'); problem!
    //Redirecting on a DELETE request doesn't work well with fetch() in JavaScript 
    //because it's expecting JSON or a basic response, not a full HTML page.
    //also The fetch() function does not treat redirects as "ok" unless it’s a GET request.
    //in the client-side if (response.ok) { -> will NOT run if response is 302

    res.status(200).json({ message: 'item deleted successfully' }); // send a basic success message instead of a redirect

    //res.json(...) sends a plain JSON response with status 200.
    // so when in script.js fetch() checks response.ok — it will be true when the status is 200–299

  } catch (err){
    console.error('Error deleting item:', err);
    res.status(500).send('Server Error');
  }
})

app.put('/edit-item/:id', async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name, //how to assign the name property of an object using the value from req.body.name
        description: req.body.description,
        price: req.body.price,
      },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'item updated', item: updatedItem });
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/thank-you', (req, res) => {
  res.render('thank-you', {message : "Your order has been processed!"});
  //need to pass the message variable, because your EJS template expects it.
});

app.post('/thank-you', (req, res) => {
  try {
    const {message} = req.body; // so it reads the message from req.body
    res.render('thank-you', {
      message: message || "Your order has been processed!"
    });
    //render thank you.ejs after successful form submission
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong');
  }
});

//'/delete-multiple' -> custom route path defined by you that have to match the frontend request
app.delete('/delete-multiple', async (req, res) =>{
  const {ids} = req.body;

  if(!Array.isArray(ids)){ //to check if the passed value is an Array.
    return res.status(400).json({error : 'Invalid data'})
  }
  try{
    //ids is that array of MongoDB _ids, ready to be passed to:
    await Item.deleteMany({_id: {$in: ids}}); //check notes
    //Waits until deletion is complete before moving on
    res.status(200).json({message: 'items deleted'})
  }catch (err){
    console.log('error:', err);
  }
})


let port = process.env.PORT || 3002;
app.listen(port, () => console.log(`Listening ${port}...`));