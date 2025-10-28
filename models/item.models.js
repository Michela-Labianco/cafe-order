const mongoose = require('mongoose');
let Schema = mongoose.Schema;


// Example Mongoose schema for contact section
const ItemSchema = new Schema({
  name: String,
  description: String,
  price: String,
  createdAt: { type: Date, default: Date.now }
});

//create and export the model
let Item = mongoose.model('Item', ItemSchema); 

module.exports = {Item};