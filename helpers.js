const getUserByEmail = function(email, database) {
  let user = {};
  Object.keys(database).forEach(key => {
    if (database[key].email === email) {
      user = database[key];
    }
  });
  return user;
};

module.exports = { getUserByEmail };