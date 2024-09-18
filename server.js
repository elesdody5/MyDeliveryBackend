const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

//For any global exception in the application EX: logging undefined variable

if (process.env.NODE_ENV !== "development") {
  mongoose
    .connect(process.env.DATABASE_LOCAL, {
      useNewUrlParser: true,
      autoIndex: true, //this is the code I added that solved it all
      keepAlive: true,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      useUnifiedTopology: true,
    })
    .then((con) => {
      console.log("connected successfully with local DB");
      let db = con.connection.db;
    });
} else {
  mongoose
    .connect(DB, {
      useNewUrlParser: true,
      autoIndex: true, //this is the code I added that solved it all
      keepAlive: true,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      useUnifiedTopology: true,
    })
    .then((con) => {
      console.log("connected successfully with hosted DB");
    });
}
const port = process.env.PORT || 8060;

const server = app.listen(port, () => {
  console.log(`app running on port ${port}..`);
});

//Globally handle any unhandled promise EX:(if the db is down or something like that)
process.on("unhandledRejection", (err) => {
  console.log(err);
  console.log("Unhandled Rejection!.. shutting down");
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM Recieved. shutting down gracefully");
  server.close(() => {
    console.log("Process terminated!");
  });
});
