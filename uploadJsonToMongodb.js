import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';

// MongoDB URI and database details
const uri = 'mongodb+srv://ourspacegloballtd:cN2GXTFQHqPi0PlI@main-ourspace.gsivw.mongodb.net/';
const dbName = 'ourspace-dev';  // Replace with your database name
const collectionName = 'waitlists';  // Replace with your collection name

// Path to the JSON file
const jsonFilePath = 'output.json'; // Replace with the path to your JSON file

// Function to upload JSON to MongoDB
async function uploadJson() {
  const client = new MongoClient(uri);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Read the JSON file
    const data = readFileSync(jsonFilePath, 'utf8');
    const jsonData = JSON.parse(data);

    // Filter out entries with null, undefined, or empty emails
    const filteredData = jsonData.filter(item => item.Email && item.Email.trim() !== '');
    
    // Log the filtered data for debugging
    console.log('Filtered Data:', filteredData);

    // Log the number of entries that passed the filter
    console.log(`Number of valid entries: ${filteredData.length}`);

    // Insert the filtered JSON data into MongoDB
    if (filteredData.length > 0) {
      const result = await collection.insertMany(filteredData, { ordered: false });
      console.log(`${result.insertedCount} documents were inserted`);
    } else {
      console.log('No valid entries to insert');
    }

  } catch (error) {
    if (error.code === 11000) {
      console.error('Duplicate key error detected:', error);
    } else {
      console.error('Error uploading JSON to MongoDB:', error);
    }
  } finally {
    // Close the MongoDB connection
    await client.close();
  }
}

// Call the function to upload JSON
uploadJson();
