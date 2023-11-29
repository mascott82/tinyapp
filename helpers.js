const bcrypt = require('bcryptjs');

const getUserByEmail = function(email, database) {
  let user = {};
  Object.keys(database).forEach(key => {
    if (database[key].email === email) {
      user = database[key];
    }
  });
  return user;
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