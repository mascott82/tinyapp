/**
 * Module containing utility functions for user authentication and URL management.
 * Includes functions for retrieving users by email, validating email and password,
 * generating random strings, and filtering URLs for a specific user.
 *
 * @module utils
 * @exports {Function} getUserByEmail - Retrieves a user from the users database based on the provided email.
 * @exports {Function} getUserByEmailAndPwd - Retrieves a user from the users database based on the provided email and password.
 * @exports {Function} generateRandomString - Generates a random string of the specified length.
 * @exports {Function} urlsForUser - Retrieves long URLs associated with a specific user from the URL database.
 */
const bcrypt = require('bcryptjs');
const { urlDatabase, users } = require('./data');

/**
 * Retrieves a user from the users database based on the provided email.
 *
 * @param {string} email - Email of the user to be retrieved.
 * @returns {object|undefined} - User object if found, otherwise undefined.
 */
const getUserByEmail = function(email) {
  for (let key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  }
};

/**
 * Retrieves a user from the users database based on the provided email and password.
 *
 * @param {string} email - Email of the user to be retrieved.
 * @param {string} pwd - Password of the user to be retrieved.
 * @returns {object|undefined} - User object if found and password matches, otherwise undefined.
 */
const getUserByEmailAndPwd = function(email, pwd) {
  for (let key in users) {
    if (users[key].email === email
      && bcrypt.compareSync(pwd, users[key].password)) {
      return users[key];
    }
  }
};

/**
 * Generates a random string of the specified length.
 *
 * @param {number} length - Length of the random string to be generated.
 * @returns {string} - Randomly generated string.
 */
const generateRandomString = function(length) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset[randomIndex];
  }

  return result;
};

/**
 * Retrieves long URLs associated with a specific user from the URL database.
 *
 * @param {string} id - User ID for filtering URLs.
 * @returns {string|undefined} - Long URL if found, otherwise undefined.
 */
const urlsForUser = function(id) {
  let urls = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      urls[key] = urlDatabase[key];
      urls[key]["totalSum"] = urlVisitsStatic(key)[0];
      urls[key]["uniqueSum"] = urlVisitsStatic(key)[1];
    }
  }
  return urls;
};

const urlVisitsStatic = function(urlId) {
  let totalSum = 0;
  let uniqueSum = 0;
  let visitsByUrlId = urlDatabase[urlId].visits;
  for (let key in visitsByUrlId) {
    uniqueSum += 1;
    totalSum += visitsByUrlId[key];
  }
  return [totalSum, uniqueSum];
};

module.exports = { getUserByEmail, getUserByEmailAndPwd, generateRandomString, urlsForUser };