const bcrypt = require('bcryptjs');

const getUserByEmail = function(email, database) {
  for (let key in database) {
    if (database[key].email === email) {
      return database[key];
    }
  }
};

const getUserByEmailAndPwd = function(email, pwd, database) {
  for (let key in database) {
    if (database[key].email === email
      && bcrypt.compareSync(pwd, database[key].password)) {
      return database[key];
    }
  }
};

module.exports = { getUserByEmail, getUserByEmailAndPwd };