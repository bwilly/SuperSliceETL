const { Client } = require('pg');

// Expect the connection string as a command-line argument.
const connectionString = process.argv[2];

if (!connectionString) {
  console.error('Usage: node test_connection.js "postgres://username:password@host:port/dbname"');
  process.exit(1);
}

const client = new Client({ connectionString });

client.connect(err => {
  if (err) {
    console.error('Connection error:', err.stack);
    process.exit(1);
  } else {
    console.log('Connected successfully!');
    client.end();
  }
});
