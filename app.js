const express = require("express");
const app = express();
let db = null;
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");
app.use(express.json());

const InitializeDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("SERVER IS RUNNING");
    });
  } catch (e) {
    console.log(`DB ERROR ${e.message}`);
    process.exit(1);
  }
};

InitializeDB();

app.post("/register/", async (request, response) => {
  const userDetails = request.body;
  const { username, name, password, gender, location } = userDetails;
  const bcryptPassword = await bcrypt.hash(password, 10);
  const passwordLength = password.length;
  const selectUserQuery = `
  SELECT
  *
  FROM
  user
  WHERE
  username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    if (passwordLength >= 5) {
      const createNewUser = `
     INSERT INTO
     user(username, name, password, gender, location)
     VALUES
     ('${username}', '${name}', '${bcryptPassword}' , '${gender}',
     '${location}');`;
      await db.run(createNewUser);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login/", async (request, response) => {
  const userDetails = request.body;
  const { username, password } = userDetails;
  const userQuery = `
  SELECT
  *
  FROM
  user
  WHERE
  username = '${username}';`;
  const dbUser = await db.get(userQuery);
  if (dbUser !== undefined) {
    const isSamePassword = await bcrypt.compare(password, dbUser.password);
    if (isSamePassword) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

//API 3

app.put("/change-password/", async (request, response) => {
  const givenObject = request.body;
  const { username, oldPassword, newPassword } = givenObject;
  const lengthNewPassword = newPassword.length;
  const dbUserQuery = `
    SELECT
    *
    FROM
    user
    WHERE
    username = '${username}';`;
  const dbUser = await db.get(dbUserQuery);
  const bcryptPassword = await bcrypt.compare(oldPassword, dbUser.password);

  if (bcryptPassword) {
    if (lengthNewPassword < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      response.status(200);
      response.send("Password updated");
      const encryptPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `
        UPDATE
        user
        SET 
        password = '${encryptPassword}'
        WHERE
        username = '${username}'`;
      await db.run(updatePasswordQuery);
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
