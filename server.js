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
  type: {
    type: String,
    required: true,
  },
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
  const { title, ingredients, instructions, type, image } = req.body;
  try {
    const recipe = await Recipe.create({
      title,
      ingredients,
      instructions,
      type,
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
  const { title, ingredients, instructions, type, image } = req.body;
  try {
    const existingRecipe = await Recipe.findById(id);
    if (!existingRecipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Check if the new image is provided
    const updatedImage = image ? image : existingRecipe.image;
    const updatedIngredients = ingredients ? ingredients : existingRecipe.ingredients;

    const updatedRecipe = await Recipe.findByIdAndUpdate(
      id,
      {
        title,
        ingredients: updatedIngredients,
        instructions,
        type,
        image: updatedImage,
      },
      { new: true }
    );

    res.json(updatedRecipe);
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

// Get recipes by type
app.get('/api/recipes/type/:type', async (req, res) => {
  const { type } = req.params;
  try {
    const recipes = await Recipe.find({ type });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});