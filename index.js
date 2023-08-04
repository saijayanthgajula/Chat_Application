const { admin, db, storage } = require('./firebase');
const bcrypt = require('bcrypt');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config()
const { v4: uuidv4 } = require("uuid");




const PORT = process.env.PORT || 8080


const app = express();
const server = app.listen(PORT, () => console.log('Server is running on port 8080'));
const io = require('socket.io')(server);
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

app.get('/', (req, res) => {
    if (req.cookies.token) {
        res.redirect('/chat');
    } else {
        res.sendFile(path.resolve(__dirname, '.', 'client', 'index.html'));
    }
});

app.use(express.static('client'));


const authenticateMiddleware = async(req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            res.redirect('/');
            return;
        }
        jwt.verify(token, 'deepakdeepakdeepakdeepakdeepakdeepak', (err, decodedToken) => {
            if (err) {
                res.redirect('/');
                return;
            }
            req.user = decodedToken;
            req.token = token;

            io.use((socket, next) => {
                socket.user = decodedToken;
                next();
            });

            next();
        });
    } catch (error) {
        console.log('Error in authentication', error);
        res.status(500).send('Something went wrong');
        res.redirect('/');
    }
};

app.get('/chat', authenticateMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'chat.html'));
});

const usersCollection = db.collection('users');

app.post('/', async(req, res) => {
    try {
        const { password } = req.body;

        const querySnapshot = await usersCollection.get();

        let isLogedIn = false;
        for (const doc of querySnapshot.docs) {
            const user = doc.data();
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (isPasswordValid) {
                const token = jwt.sign(user, 'deepakdeepakdeepakdeepakdeepakdeepak', { expiresIn: '3m' });
                isLogedIn = true;
                res.cookie('token', token, { maxAge: 180000, httpOnly: true });
                return res.status(200).send({ message: 'logged in' });
            }
        }

        if (!isLogedIn) {
            console.log('User not found');
            return res.status(404).send({ message: 'User not found' });
        }
    } catch (error) {
        console.log('Error in login', error);
        return res.status(500).send('Something went wrong');
    }
});




app.post('/user/data', (req, res) => {
    const token = req.cookies.token;
    jwt.verify(token, 'deepakdeepakdeepakdeepakdeepakdeepak', (err, decodedToken) => {
        if (err) res.send("something went wrong")
        res.send(decodedToken);
    })

});

app.post('/logout', authenticateMiddleware, (req, res) => {
    try {
        res.clearCookie('token');
        res.status(200).redirect('/');
    } catch (err) {
        console.log(err);
    }
});
const upload = multer({ dest: 'uploads/' });
app.post('/updateprofile', upload.single('photo'), async(req, res) => {
    try {
        const file = req.file;
        const date = new Date().getTime();

        const bucket = storage.bucket();
        const fileName = `${req.body.uid}`; // Use the original filename


        const uploadedFile = await bucket.upload(file.path, {
            destination: `photos/${fileName}`,
            metadata: {
                contentType: file.mimetype,
            },
        });
        fs.unlink(file.path, (error) => {
            if (error) {
                console.error('Error deleting file:', error);
            }
        })

        // Get the download URL of the uploaded file
        const downloadURL = await uploadedFile[0].getSignedUrl({
            action: 'read',
            expires: '03-09-2050',
        });
        const userRef = db.collection("users").doc(req.body.uid)
        userRef.update({
                photoURL: downloadURL[0],
            })
            .then(() => {
                console.log('User document updated successfully');
            })
            .catch((error) => {
                console.error('Error updating user document:', error);
            });

        // Send the download URL back to the client
        res.status(200).json({ downloadURL });
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({ error: 'Error uploading photo' });
    }
})

app.use('/admin', require('./Routes/Admin'))
app.get('/users', require('./middlewares/adminAuth'), (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'users.html'))
})
app.get('/messages', require('./middlewares/adminAuth'), (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'messages.html'))
    })
    // ----------------------------------------------------------------------------------
    // Socket.IO
    io.on('connection', (socket) => {
        console.log('A user connected');
    
        // Fetch and emit previous messages on connection
        const messagesRef = db.collection("messages");
        messagesRef.orderBy("timestamp", 'asc').get().then((snapshot) => {
            snapshot.forEach((message) => {
                const previousMessages = message.data();
                socket.emit('previousMessages', [previousMessages]);
            })
        });
    
        // Handle incoming chat messages
        socket.on('chatMessage', (message) => {
            const user = socket.user;
    
            // Store the message in the database
            const messagesRef = db.collection("messages");
        const messageId = uuidv4();
    
        messagesRef
          .add({
            message_id: messageId,
            sender_id: user.id,
            sender_name: user.username,
            content: message,
            timestamp: new Date(),
          })
          .then(() => {
            console.log("Message stored successfully");
    
            // Broadcast the message to all connected clients
            io.emit("chatMessage", {
              message_id: messageId,
              id: user.id,
              sender_name: user.username,
              content: message,
              timestamp: new Date(),
            });
          })
          .catch((error) => {
            console.error("Error storing message:", error);
          });
        });
    
        socket.on("deleteMessage", (message_id) => {
            const messagesRef = db.collection("messages");
            // Find the message(s) with the matching message_id in the database
            messagesRef
              .where("message_id", "==", message_id)
              .get()
              .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                  // Delete the message document
                  doc.ref
                    .delete()
                    .then(() => {
                      console.log("Message deleted successfully");
                      io.emit("messageDeleted", message_id);
                    })
                    .catch((error) => {
                      console.error("Error deleting message:", error);
                    });
                });
        
                // Broadcast the deleted message_id to all connected clients
                io.emit("messageDeleted", message_id);
              })
              .catch((error) => {
                console.error("Error querying messages:", error);
              });
          });
        
    
        // Handle disconnections
        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    });

app.delete("/messages/:id", (req, res) => {
    const messageId = req.params.id;
    const messageRef = firebase.database().ref(`messages/${messageId}`);
    messageRef
      .remove()
      .then(() => {
        res.status(200).json({ message: "Message deleted successfully." });
      })
      .catch((error) => {
        console.error("Error deleting message:", error);
        res.status(500).json({ error: "Internal server error." });
      });
      
  });
