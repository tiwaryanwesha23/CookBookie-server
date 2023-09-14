const express = require('express');
const mongoose = require('mongoose');
const Redis = require('async-redis');
const cors = require('cors');

const app = express();

// Create a Redis client
const redisClient = Redis.createClient({
  url: "rediss://red-ck0vnfkojvrs73a6rcl0:IPOnaaiVqXjL4SMACRbTuuEJQbZhYi8U@singapore-redis.render.com:6379"
});

redisClient.on('error', (error) => {
  console.error(`Redis Error: ${error}`);
});

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
  const cacheKey = 'recipes:all';

  try {
    // Check if the data is cached
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      // If cached data exists, send it as the response
      const recipes = JSON.parse(cachedData);
      res.json(recipes);
    } else {
      // If no cached data, query the MongoDB database
      const recipes = await Recipe.find();

      // Store the result in the cache for future use
      await redisClient.setex(cacheKey, 3600, JSON.stringify(recipes)); // Cache for 1 hour

      res.json(recipes);
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get a single recipe
app.get('/api/recipes/:id', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `recipe:${id}`;

  try {
    // Check if the data is cached
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      // If cached data exists, send it as the response
      const recipe = JSON.parse(cachedData);
      res.json(recipe);
    } else {
      // If no cached data, query the MongoDB database
      const recipe = await Recipe.findById(id);

      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }

      // Store the result in the cache for future use
      await redisClient.setex(cacheKey, 3600, JSON.stringify(recipe)); // Cache for 1 hour

      res.json(recipe);
    }
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

 // API Route to update a recipe
 app.put('/api/recipes/:id', async (req, res) => {
  const { id } = req.params;
  const { title, ingredients, instructions, type } = req.body;

  try {
    const existingRecipe = await Recipe.findByIdAndUpdate(
      id,
      {
        title,
        ingredients,
        instructions,
        type,
      },
      { new: true }
    );

    // If the recipe is updated, update it in the cache
    if (existingRecipe) {
      const cacheKey = 'recipes:all';
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        const cachedRecipes = JSON.parse(cachedData);
        const updatedRecipes = cachedRecipes.map((recipe) =>
          recipe._id.toString() === id ? existingRecipe : recipe
        );
        await redisClient.setex(cacheKey, 3600, JSON.stringify(updatedRecipes)); // Update cache
      }
    }

    res.json(existingRecipe);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



  // API Route to delete a recipe
  app.delete('/api/recipes/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const deletedRecipe = await Recipe.findByIdAndDelete(id);
  
      // If the recipe is deleted, remove it from the cache
      if (deletedRecipe) {
        const cacheKey = 'recipes:all';
        const cachedData = await redisClient.get(cacheKey);
  
        if (cachedData) {
          const cachedRecipes = JSON.parse(cachedData);
          const updatedRecipes = cachedRecipes.filter(
            (recipe) => recipe._id.toString() !== id
          );
          await redisClient.setex(cacheKey, 3600, JSON.stringify(updatedRecipes)); // Update cache
        }
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
