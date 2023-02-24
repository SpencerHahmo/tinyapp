const bcrypt = require("bcryptjs");
const { assert } = require('chai');
const { getUserByEmail, getUserPassword, getUserID} = require('../helpers.js');

const testUsers = {
  aJ48lW: {
    id: "aJ48lW",
    email: "test@me",
    password: bcrypt.hashSync("fun", 10),
  },
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10),
  },
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', () => {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    
    assert.strictEqual(user, expectedUserID);
  });

  it('should return a user with an non-existant email', () => {
    const user = getUserByEmail("bobross@hotmail.com", testUsers);
    const expectedUserID = "bobross";

    assert.isUndefined(user, expectedUserID);
  });

  it('should return true if you enter the correct password', () => {
    const password = "fun";
    const test = getUserPassword(password, testUsers);
    const expectedResult = true;

    assert.strictEqual(test, expectedResult);
  });

  it('should return false if you enter the incorrect password', () => {
    const password = "123";
    const test = getUserPassword(password, testUsers);
    const expectedResult = false;

    assert.isFalse(test, expectedResult);
  });

  it("should return undefined when entering an email and password that don't match anything in the database", () => {
    const password = "painting";
    const email = "bobross@hotmail.com";

    assert.isUndefined(getUserID(email, password, testUsers));
  });

  it("should return the user id when entering an email and password that match an entry in the database", () => {
    const password = "dishwasher-funk";
    const email = "user2@example.com";
    const expectedUserID = "user2RandomID";

    assert.strictEqual(getUserID(email, password, testUsers), expectedUserID);
  });
});