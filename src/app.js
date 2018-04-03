require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');

// GitHub official REST API client for Node.js
const Octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'cmoore4os'; // process.env.GITHUB_USERNAME; // TODO: your GitHub username here
const github = new Octokit({ debug: true });
const server = express();

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});
// TODO: add bodyParser
server.use(bodyParser.urlencoded({ extened: true }));
server.use(bodyParser.json());

// Set up the encryption - use process.env.SECRET_KEY if it exists
// TODO either use or generate a new 32 byte key
const secret = process.env.SECRET_KEY
  ? nacl.util.encodeBase64(process.env.SECRET_KEY)
  : nacl.randomBytes(32);

server.get('/', (req, res) => {
  // TODO Return a response that documents the other routes/operations available
  res.send(`Secret Gists</br>
  /gist: to see a list of all of your gist</br>
  /key : return the secret key used for encryption of secret gists
  
  `);
});

server.get('/gists', (req, res) => {
  // Done Retrieve a list of all gists for the currently authed user
  github.gists
    .getForUser({ username })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.get('/key', (req, res) => {
  // TODO Return the secret key used for encryption of secret gists
});

server.get('/secretgist/:id', (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
});

server.post('/create', (req, res) => {
  // TODO Create a private gist with name and content given in post request
});

server.post('/createsecret', (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // To save, we need to keep both encrypted content and nonce
});

/* OPTIONAL - if you want to extend functionality */
server.post('/login', (req, res) => {
  // TODO log in to GitHub, return success/failure response
  // This will replace hardcoded username from above
  // const { username, oauth_token } = req.body;
  res.json({ success: false });
});

/*
Still want to write code? Some possibilities:
-Pretty templates! More forms!
-Better management of gist IDs, use/display other gist fields
-Support editing/deleting existing gists
-Switch from symmetric to asymmetric crypto
-Exchange keys, encrypt messages for each other, share them
-Let the user pass in their private key via POST
*/

server.listen(3000, () => {
  console.log('server listening on port 3000');
});
