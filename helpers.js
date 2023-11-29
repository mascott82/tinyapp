const bcrypt = require('bcryptjs');
const { urlDatabase, users } = require('./data');

const getUserByEmail = function(email) {
  for (let key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  }
};

const getUserByEmailAndPwd = function(email, pwd) {
  for (let key in users) {
    if (users[key].email === email
      && bcrypt.compareSync(pwd, users[key].password)) {
      return users[key];
    }
  }
};

// Helper function to generate random strings
const generateRandomString = function(length) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset[randomIndex];
  }

  return result;
};

// Helper function to filter URLs for a specific user
const urlsForUser = function(id) {
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      return  urlDatabase[key].longURL;
    }
  }
};

module.exports = { getUserByEmail, getUserByEmailAndPwd, generateRandomString, urlsForUser };