const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

const databaseAndCollection = { db: "final_project", collection: "users" };

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${userName}:${password}@cluster0.6vm3z.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function connect() {
  await client.connect();
}

async function login(email) {
  let result = await findUser(email);
  if (!result) {
    result = await createUser(email);
  }

  return result
}

async function findUser(user) {
  let filter = { email: user.email };
  const result = await client
    .db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .findOne(filter);

  return result;
}

async function createUser(user) {
    let newUser = {
        name: user.name,
        email: user.email,
        photos: []
    }
    
    await client
    .db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .insertOne(newUser);

    return newUser;
}

async function loadPhotos(email){
    let filter = { email: email };
    const user = await client
      .db(databaseAndCollection.db)
      .collection(databaseAndCollection.collection)
      .findOne(filter);
  
    return user.photos;
}








async function insertApplication(appplication) {
  if (!(await findApplication(appplication.email))) {
    const result = await client
      .db(databaseAndCollection.db)
      .collection(databaseAndCollection.collection)
      .insertOne(appplication);
  }
}

async function findApplication(email) {
  let filter = { email: email };
  const result = await client
    .db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .findOne(filter);

  return result;
}

async function findByGPA(gpa) {
  let filter = { gpa: { $gte: gpa } };
  const cursor = await client
    .db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find(filter);
  const result = await cursor.toArray();

  return result;
}

async function clear() {
  const result = await client
    .db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .deleteMany({});
  return result.deletedCount;
}

module.exports = {
  connect,
  login,
  loadPhotos
};
