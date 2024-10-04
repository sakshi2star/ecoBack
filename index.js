const express = require("express");
const cors = require("cors");
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const multer = require('multer');
const jwt = require('jsonwebtoken');
require('dotenv').config()

const Counter = require("./model/counterModel");
const User = require("./model/signUpModel");
const Product = require("./model/productModel");
const Image = require("./model/imageModel")
const app = express();

app.use(express.json());
app.use(cors({
    origin: [
        'http://localhost:3000', // Your local frontend URL
        'https://eco-front-five.vercel.app' // Your deployed frontend URL
    ],
    credentials: true // Allow cookies and credentials to be sent across domains
}));

const PORT = 5000;

const fs = require('fs');
const path = require('path');
const { JsonWebTokenError } = require("jsonwebtoken");
const { log, error } = require("console");

// Ensure 'uploads/' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.log('Error connecting to MongoDB:', error.message);
    });


app.get('/', (req, res) => {
    res.send("Express Run")
})

app.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password is required and must be at least 6 characters' });
        }

        // Hash the password
        const saltRounds = 10; // Define salt rounds for bcrypt
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Initialize cart with 300 items set to 0
        let cart = {};
        for (let i = 0; i < 300; i++) {
            cart[i] = 0;
        }

        // Create a new user
        const newUser = new User({
            email,
            password: hashedPassword,
            cartData: cart
        });

        await newUser.save();

        // Prepare data for JWT
        const data = {
            user: {
                id: newUser._id // Use newUser._id to reference the new user ID
            }
        };

        // Sign the JWT token
        const token = jwt.sign(data, process.env.JWT_SECRET, { expiresIn: '1h' }); // Optional: set expiration time for the token

        // Send response back to client
        res.status(201).json({ success: true, token, message: 'User created successfully' });

    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});



// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    // Find user in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
  
    // Check password (assuming you hash passwords)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
  
    // Generate token
    const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
    // Return success response with the token
    return res.status(200).json({ message: 'Login successful', token });
  });
  

// Auto-increment ID for products
async function getNextSequenceValue(sequenceName) {
    const sequenceDocument = await Counter.findByIdAndUpdate(
        { _id: sequenceName },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return sequenceDocument.seq;
}



// Configure Multer for file uploads

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Define where the images will be stored
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Use timestamp to avoid duplicate file names
    }
});


const upload = multer({ storage: storage });

// POST route for uploading an image
// POST route for uploading an image
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const { name } = req.body;
        const imageUrl = req.file.path;  // Multer stores the file path in req.file

        // Create a new image entry
        const newImage = new Image({
            name,
            image: imageUrl // Assuming you want to store the path to the image
        });

        // Save the image to the database
        await newImage.save();

        res.status(200).json({ success: true, message: 'Image uploaded successfully', data: newImage });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ success: false, message: 'Failed to upload image', error });
    }
});

// Route to add a product with image and multiple thumbnails uploads
app.post('/add', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'thumbnails', maxCount: 5 }]), async (req, res) => {
    try {
        const { name, description, rating, reviews, price, originalPrice, discount, category, sizes, colors } = req.body;

        // Ensure you have files uploaded
        if (!req.files.image || !req.files.thumbnails) {
            return res.status(400).json({ message: 'Image and thumbnails are required' });
        }

        // Get the next auto-incremented ID
        const id = await getNextSequenceValue('productid');

        // Get the main image file path
        const imagePath = req.files.image[0].path;

        // Get all the thumbnails file paths
        const thumbnailsPaths = req.files.thumbnails.map(file => file.path);

        // Create a new product instance
        const newProduct = new Product({
            id,
            name,
            description,
            rating: parseFloat(rating),
            reviews: parseInt(reviews),
            price: parseFloat(price),
            originalPrice: parseFloat(originalPrice),
            discount,
            image: imagePath,
            thumbnails: thumbnailsPaths,
            category,
            sizes: sizes.split(','),
            colors: colors.split(',')
        });

        // Save the product to the database
        await newProduct.save();

        res.status(201).json({ message: 'Product added successfully', product: newProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding product', error });
    }
});

//Route All Product
app.get('/allProduct', async (req, res) => {
    let products = await Product.find({});
    console.log(req.body);
    res.send(products);
})

//Rout New 
app.get('/newArrival', async (req, res) => {
    try {
        let products = await Product.find({});
        let newProducts = products.slice(1).slice(-2);
        res.send(newProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Internal Server Error');
    }
});

//creating miidleware to fetch User
const fetchUser = async (req, res, next) => {
    const token = req.headers['authtoken'];
    if (!token) {
        return res.status(401).send({ error: "Please authenticate using a valid token" });
    }

    try {
        const data = jwt.verify(token, 'secret_ecom');
        req.user = data.user;
        next();
    } catch (error) {
        console.error('JWT verification failed:', error);
        return res.status(401).send({ error: "Please authenticate with a valid token" });
    }
};

//Rout Add To Cart
app.post('/addToCart', fetchUser, async (req, res) => {
    try {
        console.log('Request Body:', req.body);
        console.log('Authenticated User:', req.user);

        const { id } = req.body;

        // Ensure product ID is provided
        if (!id) {
            return res.status(400).send({ error: "Product ID is required" });
        }

        // Fetch the user from the database
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).send({ error: "User not found" });
        }

        // Convert product ID to string since Mongoose Map only supports string keys
        const productId = id.toString();

        // Update the cart data, using the product ID as a string key
        const currentQuantity = user.cartData.get(productId) || 0;
        user.cartData.set(productId, currentQuantity + 1);

        // Save the updated cartData in the database
        await user.save();

        res.status(200).send({ success: true, message: "Item added to cart" });
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).send({ error: "Internal server error while adding item to cart" });
    }
});

//Rout Remove To Cart
app.post('/removeFromCart', fetchUser, async (req, res) => {
    try {
      console.log('Request Body:', req.body); // Log request body
      console.log('Authenticated User:', req.user); // Log authenticated user data
  
      const { id } = req.body;
      if (!id) {
        return res.status(400).send({ error: "Product ID is required" });
      }
  
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).send({ error: "User not found" });
      }
  
      const productId = id.toString();
      console.log('Product ID in string format:', productId); // Log productId
  
      const currentQuantity = user.cartData.get(productId);
      console.log('Current quantity:', currentQuantity); // Log current quantity
  
      if (!currentQuantity) {
        return res.status(400).send({ error: "Product not found in cart" });
      }
  
      if (currentQuantity > 1) {
        user.cartData.set(productId, currentQuantity - 1);
      } else {
        user.cartData.delete(productId);
      }
      await user.save();
  
      res.status(200).send({ success: true, message: "Item removed from cart" });
    } catch (error) {
      console.error('Error removing item from cart:', error);
      res.status(500).send({ error: "Internal server error while removing item from cart" });
    }
  });
  
//Route Remove Product
app.get('/removeProduct', async (req, res) => {
    let products = await Product.findOneAndDelete({ id: req.body.id });
    console.log(req.body);
    res.send(products);
})

app.post('/getCart',fetchUser,async(req,res)=>{
    console.log("GetCart");
    const useData = await User.findOne({_id:req.user.id});
    res.json(useData.cartData)

    
})


app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
});
