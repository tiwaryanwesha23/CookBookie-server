const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// MongoDB configuration
mongoose.connect('mongodb+srv://anwesha:anwesha@receipeapp.j5v9ayc.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Mongoose model for recipes
const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  ingredients: [{ type: String, required: true }],
  instructions: { type: String, required: true },
  image: String, // Add the image field
});

const Recipe = mongoose.model('Recipe', recipeSchema);

app.use(cors());
app.use(express.json());

// API Routes
// Get all recipes
app.get('/api/recipes', async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get a single recipe
app.get('/api/recipes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a new recipe
app.post('/api/recipes', async (req, res) => {
  const { title, ingredients, instructions, image } = req.body;
  try {
    const recipe = await Recipe.create({
      title,
      ingredients,
      instructions,
      image,
    });
    res.status(201).json({ message: 'Recipe Created', recipe });
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Update a recipe
app.put('/api/recipes/:id', async (req, res) => {
  const { id } = req.params;
  const { title, ingredients, instructions, image } = req.body;
  try {
    const recipe = await Recipe.findByIdAndUpdate(
      id,
      {
        title,
        ingredients,
        instructions,
        image,
      },
      { new: true }
    );
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a recipe
app.delete('/api/recipes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const recipe = await Recipe.findByIdAndDelete(id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json({ message: 'Recipe deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});