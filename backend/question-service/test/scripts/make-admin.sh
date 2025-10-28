#!/bin/bash

# Script to make a user admin via MongoDB Atlas

EMAIL="testneww@test.com"

echo "Making $EMAIL an admin..."

# Connect to MongoDB and update user
docker exec cs3219-ay2526s1-project-g35-user-service-1 node -e "
const mongoose = require('mongoose');

const DB_URI = process.env.DB_CLOUD_URI;

mongoose.connect(DB_URI).then(async () => {
  console.log('Connected to MongoDB');
  
  const db = mongoose.connection.db;
  const users = db.collection('users');
  
  const result = await users.updateOne(
    { email: '$EMAIL' },
    { \$set: { isAdmin: true } }
  );
  
  console.log('Update result:', result);
  
  const user = await users.findOne({ email: '$EMAIL' }, { projection: { username: 1, email: 1, isAdmin: 1 } });
  console.log('Updated user:', user);
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
"

echo "Done! You are now an admin."

