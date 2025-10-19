// Import necessary modules
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// --- Configuration ---
const app = express();
const PORT = process.env.PORT || 3000;
const CAT_FACT_URL = process.env.CAT_FACT_API_URL || 'https://catfact.ninja/fact';
// Timeout in milliseconds (e.g., 5000ms = 5 seconds)
const CAT_FACT_TIMEOUT = parseInt(process.env.CAT_FACT_TIMEOUT_MS, 10) || 5000;
const FALLBACK_FACT = process.env.FALLBACK_FACT || "Cats are amazing, but the fact server is sleeping right now!";

// User Data (loaded from environment variables for easy change)
const userProfile = {
  email: process.env.USER_EMAIL || 'tabansishedrack309@gmail.com',
  name: process.env.USER_NAME || 'Shedrack Tabansi',
  stack: process.env.USER_STACK || 'Node.js/Express',
};

// --- Middleware ---
// Ensure the response is always JSON and set CORS (optional, but good practice)
app.use(express.json());
app.use((req, res, next) => {
  // Sets the Content-Type header explicitly as required
  res.setHeader('Content-Type', 'application/json');
  // Simple CORS policy for development/testing
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  next();
});

// --- Helper Function for External API Integration ---

/**
 * Fetches a random cat fact from the external API with error handling and timeout.
 * @returns {Promise<string>} The cat fact string or a fallback message on failure.
 */
async function fetchCatFact() {
  try {
    // Make the API call with the configured timeout
    const response = await axios.get(CAT_FACT_URL, {
      timeout: CAT_FACT_TIMEOUT,
    });

    // Validate the response status and check for the required 'fact' field
    if (response.status === 200 && response.data && response.data.fact) {
      console.log('Successfully fetched new cat fact.');
      return response.data.fact;
    }

    // Fallback if API returns 200 but the body format is wrong
    console.error(`Cat Fact API returned an unexpected body format.`);
    return FALLBACK_FACT;
  } catch (error) {
    // Log and handle network errors, timeouts, or non-200 responses gracefully
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error(`Error: Cat Fact API call timed out after ${CAT_FACT_TIMEOUT}ms. Returning fallback fact.`);
    } else {
      console.error('Error fetching cat fact (network/API error):', error.message);
    }
    // Return the fallback message to keep the main endpoint operational
    return FALLBACK_FACT;
  }
}


// --- RESTful Endpoint: GET /me ---

/**
 * GET /me endpoint: Returns profile information and a dynamic cat fact.
 */
app.get('/me', async (req, res) => {
  // 1. Fetch dynamic data (cat fact)
  const catFact = await fetchCatFact();

  // 2. Generate dynamic timestamp in ISO 8601 format (UTC)
  // This value updates on every request as required by the task
  const currentTimestamp = new Date().toISOString();
  
  // 3. Construct the final response object following the exact schema
  const responseData = {
    status: 'success',
    user: userProfile,
    timestamp: currentTimestamp,
    fact: catFact,
  };

  // 4. Send the 200 OK response with Content-Type: application/json (set in middleware)
  res.status(200).json(responseData);
});

// --- Server Start ---
app.listen(PORT, () => {
  console.log(`\n✅ Backend Wizard Stage 0 Server is running on port ${PORT}`);
  console.log(`Endpoint accessible at: http://localhost:${PORT}/me\n`);
  console.log(`User Name: ${userProfile.name}`);
  console.log(`Stack: ${userProfile.stack}`);
});
