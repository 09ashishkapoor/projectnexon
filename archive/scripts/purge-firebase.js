/**
 * Firebase Database Purge Utility
 * 
 * This script deletes all documents from the 'subscriptions' collection in your Firestore database.
 * USE WITH CAUTION: This will permanently delete all subscriber data.
 * 
 * Usage:
 *   node purge-firebase.js [--force]
 *   
 * The --force flag bypasses the confirmation prompt.
 */

const readline = require('readline');
const { admin, db, subscriptionStore } = require('./config/firebase');

// Collection name to purge
const COLLECTION_TO_PURGE = 'subscriptions';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Performs the actual data purge
 */
async function purgeData() {
  try {
    console.log('Fetching all documents in the collection...');
    const snapshot = await db.collection(COLLECTION_TO_PURGE).get();
    
    if (snapshot.empty) {
      console.log('The collection is already empty. Nothing to delete.');
      process.exit(0);
    }
    
    const count = snapshot.size;
    console.log(`Found ${count} documents to delete.`);
    
    console.log('Deleting documents...');
    const batchSize = 500; // Firestore has a limit of 500 operations per batch
    const batches = [];
    let currentBatch = db.batch();
    let operationCounter = 0;
    
    // Process documents in batches
    snapshot.forEach(doc => {
      currentBatch.delete(doc.ref);
      operationCounter++;
      
      if (operationCounter >= batchSize) {
        batches.push(currentBatch.commit());
        currentBatch = db.batch();
        operationCounter = 0;
      }
    });
    
    // Commit any remaining operations in the final batch
    if (operationCounter > 0) {
      batches.push(currentBatch.commit());
    }
    
    // Execute all batches
    await Promise.all(batches);
    
    console.log(`✅ Successfully deleted all ${count} documents from the '${COLLECTION_TO_PURGE}' collection.`);
  } catch (error) {
    console.error(`❌ Error purging data:`, error);
    process.exit(1);
  } finally {
    // Close Firestore connection
    await admin.app().delete();
    process.exit(0);
  }
}

/**
 * Main function with confirmation prompt
 */
async function main() {
  const args = process.argv.slice(2);
  const forceMode = args.includes('--force');
  
  // Show warning
  console.log('\n⚠️  WARNING: You are about to delete ALL DATA from your Firebase database ⚠️');
  console.log(`This will permanently delete all documents in the '${COLLECTION_TO_PURGE}' collection.`);
  console.log('This action CANNOT be undone.\n');
  
  // In force mode, skip confirmation
  if (forceMode) {
    console.log('Force mode enabled. Proceeding with deletion without confirmation...');
    await purgeData();
    return;
  }
  
  // Get confirmation
  rl.question('Type "DELETE ALL DATA" (in all caps) to confirm: ', async (answer) => {
    rl.close();
    
    if (answer === 'DELETE ALL DATA') {
      await purgeData();
    } else {
      console.log('Operation canceled. No data was deleted.');
      process.exit(0);
    }
  });
}

// Run the main function
main();