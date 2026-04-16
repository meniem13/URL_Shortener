const { customAlphabet } = require('nanoid');

// Base62 Alphabet
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
// Create a 7-character code generator
const generateCode = customAlphabet(alphabet, 7);

module.exports = generateCode;
