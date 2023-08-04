const mysqlConnetion = require('./connection')

// connection.query(
//     `CREATE TABLE IF NOT EXISTS users (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     password VARCHAR(255) NOT NULL
//   )`,
//     (err) => {
//         if (err) throw err;
//         console.log('Table created successfully');
//         mysqlConnetion.end();
//     }
// );