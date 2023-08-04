var admin = require("firebase-admin");
const bcrypt = require('bcrypt');
require('dotenv').config()
const SERVICE_ACCOUNT_KEY = require('./serviseAccountKey.json')
console.log(process.env.SERVICE_ACCOUNT_KEY)
admin.initializeApp({

    credential: admin.credential.cert(SERVICE_ACCOUNT_KEY),
    databaseURL: process.env.DATABASE_URL,
    storageBucket: process.env.STOREAGE_BUCKET
});

const hashPass = async(pass) => {
    const saltRounds = 10;
    const encryptedPass = await bcrypt.hash(pass, saltRounds)
    return encryptedPass;

}

const db = admin.firestore();
// Create 'users' collection
const usersCollection = db.collection('users');
usersCollection
    .get()
    .then(async(snapshot) => {
        const userCount = snapshot.size;

        if (userCount === 0) {
            // Insert sample users
            const pass1 = await hashPass('password1')
            const pass2 = await hashPass('password2')
            const users = [{
                    username: 'user1',
                    password: pass1,
                    email: 'user1@example.com',
                    photoURL: ""
                },
                {
                    username: 'user2',
                    password: pass2,
                    email: 'user2@example.com',
                    photoURL: "",
                }
            ];

            const batch = db.batch();
            users.forEach((user) => {
                const userRef = usersCollection.doc();
                batch.set(userRef, {...user, id: userRef.id });
            });

            return batch.commit();
        } else {
            console.log('Sample users already exist');
            return Promise.resolve();
        }
    })
    .then(() => {
        console.log('Sample users inserted successfully');
    })
    .catch((error) => {
        console.error('Error inserting sample users:', error);
    });

// Create 'messages' collection
const messagesCollection = db.collection('messages');
messagesCollection
    .get()
    .then((snapshot) => {
        if (snapshot.empty) {
            // Create 'messages' collection if it doesn't exist
            return messagesCollection
                .doc()
                .set({
                    sender_id: 1,
                    sender_name: 'user1',
                    content: 'Hello, user2!',
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
        } else {
            console.log('Table already exists');
            return Promise.resolve();
        }
    })
    .then(() => {
        console.log('Table created successfully');
    })
    .catch((error) => {
        console.error('Error creating table:', error);
    });
const storage = admin.storage()


module.exports = { admin, db, hashPass, storage };