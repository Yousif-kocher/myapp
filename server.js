// server.js

const express = require('express');
const mysql = require('mysql2/promise');  // Use promise-based version
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config(); // last edit

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const app = express();
const port = 3000;

app.use(cors());
// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(express.json()); // last edit.

// Create MySQL connection - Use async function to handle connection
let db;

async function connectDB() {
  try {
    // Create a connection with the database using mysql2/promise
    db = await mysql.createConnection({
      host: 'brudvuoegtfb8ky8mrhm-mysql.services.clever-cloud.com',
      user: 'up50n4gjn4uosc4r',
      password: 'HhfrEg6nhgxaCERhinY7',
      database: 'brudvuoegtfb8ky8mrhm'
    });
    console.log('Connected to MySQL');
  } catch (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);  // Stop the server if connection fails
  }
}





// Login Route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Check if username and password match the environment variables
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      res.status(200).json({ message: 'Login successful' });
  } else {
      res.status(401).json({ message: 'Access denied' });
  }
});


app.post('/save-maping', (req, res) => {
    const { x, y, tooltip, color } = req.body;

    // Ensure you are getting the data correctly
    console.log(req.body);

    // Assuming you are using MySQL to insert the data
    const query = "INSERT INTO marker (x_coordinate, y_coordinate, tooltip, color) VALUES (?, ?, ?, ?)";
    db.query(query, [x, y, tooltip, color], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error saving marker', error: err });
        }
        res.status(200).json({ message: 'Marker saved successfully', markerId: result.insertId });
    });
});

// API endpoint to load markers
// Endpoint to fetch all markers from the database
app.get('/get-markers', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM marker');
        res.json(rows);  // Send the marker data as a response
    } catch (error) {
        console.error('Error fetching markers:', error);
        res.status(500).json({ message: 'Error fetching markers', error });
    }
});
// Endpoint to delete a marker from the database

app.delete('/delete-marker', async (req, res) => {
  const { x, y } = req.body;

  console.log('Received coordinates:', { x, y }); // Debugging

  try {
      // Use ROUND in SQL query for both x_coordinate and y_coordinate
      const [rows] = await db.query(
          `SELECT id 
           FROM marker 
           WHERE ROUND(x_coordinate, 3) = ROUND(?, 3) 
             AND ROUND(y_coordinate, 3) = ROUND(?, 3)`,
          [x, y]
      );

      console.log('SQL SELECT Result:', rows); // Debugging SQL result

      // Check if any marker was found
      if (rows.length === 0) {
          console.log('No marker found for provided coordinates.');
          return res.status(404).json({ message: 'Marker not found' });
      }

      // Extract marker ID for deletion
      const markerId = rows[0].id;
      console.log('Marker found, ID:', markerId);

      const [deleteResult] = await db.query('DELETE FROM marker WHERE id = ?', [markerId]);

      console.log('Delete query executed, result:', deleteResult);

      if (deleteResult.affectedRows === 0) {
          console.error('Delete operation failed unexpectedly.');
          return res.status(500).json({ message: 'Error deleting marker' });
      }

      console.log('Marker deleted successfully, ID:', markerId);
      res.json({ message: 'Marker deleted successfully' });
  } catch (error) {
      console.error('Error deleting marker:', error);
      res.status(500).json({ message: 'Error deleting marker' });
  }
});







// Endpoint to fetch marker counts by color
app.get('/get-marker-counts', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT 
                (SELECT COUNT(*) FROM marker WHERE color = 'red') AS red_count,
                (SELECT COUNT(*) FROM marker WHERE color = 'blue') AS blue_count,
                (SELECT COUNT(*) FROM marker WHERE color = 'black') AS black_count,
                (SELECT COUNT(*) FROM marker WHERE color = 'green') AS green_count`
        );

        // The result rows[0] should contain the counts as expected
        res.json({
            red_count: rows[0].red_count,
            blue_count: rows[0].blue_count,
            black_count: rows[0].black_count,
            green_count: rows[0].green_count
        });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ message: 'Error fetching marker counts', error: error.message });
    }
});

// Start server after DB connection
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
