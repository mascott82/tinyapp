const { assert } = require('chai');

const { getUserByEmail } = require('../helpers');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email:  "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID":  {
    id: "user2RandomID",
    email:  "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(user.id, expectedUserID);
  });

  it('should return undefined with invalid email', function() {
    const user = getUserByEmail('test@example.com', testUsers);
    const expectedUserID = "undefined";
    assert.equal(String(user.id), expectedUserID);
  });
});