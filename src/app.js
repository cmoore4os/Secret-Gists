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
  ? nacl.util.decodeBase64(process.env.SECRET_KEY)
  : nacl.randomBytes(32);

server.get('/', (req, res) => {
  // TODO Return a response that documents the other routes/operations available
  res.send(
    `<h1>Secret Gists</h1>
    <h2>Supported operations: </h2>
    <ul>
      <li><a href='/gist'>GET /gists:</a> to see a list of all of your gist </li>
      <li><a href='/key'>Get /key :</a> return the secret key used for encryption of secret gists</li>
      <li>GET /secretgist/:id : retrieves and decrypts the given secret gist</li>
      <li>POST /create {name, content}creates a private gist for the authorized user with the given name/content </li>
      <li>POST /createsecret {name, content}creates a private and encrypted gist for the authorized user with the given name/content </li>
    </ul>

       <h3>Create an *unencrypted* gist</h3>
        <form action="/create" method="post">
        <label>
            Name: <input type="text" name="name" size=70 required>
          </label><br>
          <label >
            Content:<br>
            <textarea name="content" cols="100" rows="15" required>
            </textarea>
          </label><br>
          <input type="submit" value="Submit">
        </form>
        
        <h3>Create an *encrypted* gist</h3>
        <form action="/createsecret" method="post">
          <label>
            Name: <input type="text" name="name" size=70 required>
          </label><br>
          <label >
            Content:<br>
            <textarea name="content" cols="100" rows="15" required>
            </textarea>
          </label><br>
          <input type="submit" value="Submit">
        </form>
  `
  );
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
  res.json(nacl.util.encodeBase64(secret));
});

server.get('/gists/:id', (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
  const { id } = req.params;
  github.gists
    .get({ id })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.get('/secretgist/:id', (req, res) => {
  // Retrieve and decrypt the secret gist corresponding to the given ID
  const id = req.params.id;
  github.gists.get({ id }).then((response) => {
    const gist = response.data;
    // Assuming gist has only 1 file and/or we only care about that file
    const filename = Object.keys(gist.files)[0];
    const blob = gist.files[filename].content;
    // Assume nonce is first 24 bytes of blob, split and decrypt remainder
    // N.B. 24 byte nonce == 32 characters encoded in Base64
    const nonce = nacl.util.decodeBase64(blob.slice(0, 32));
    const ciphertext = nacl.util.decodeBase64(blob.slice(32, blob.length));
    const plaintext = nacl.secretbox.open(ciphertext, nonce, key);
    res.send(nacl.util.encodeUTF8(plaintext));
  });
});

server.post('/create', (req, res) => {
  // TODO Create a private gist with name and content given in post request

// Create a private gist with name and content given in post request
  const { name, content } = req.body;
  const files = { [name]: { content } };
  github.gists.create({ files, public: false })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.post('/createsecret', urlencodedParser, (req, res) => {
  // Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  const { name, content } = req.body;
  const nonce = nacl.randomBytes(24);
  const ciphertext = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, key);
  // To save, we need to keep both encrypted content and nonce
  const blob = nacl.util.encodeBase64(nonce) +
        nacl.util.encodeBase64(ciphertext);
  const files = { [name]: { content: blob } };
  github.gists.create({ files, public: false })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
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
