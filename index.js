process.stdin.setEncoding("utf8");
const http = require("http");
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const { connect, login, loadPhotos } = require("./database");
const { response } = require("express");
const { get } = require("express/lib/response");

const port = 4000;
const app = express();

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

//global objects
let user;
let array = [];
let thumbnails;
let currentImage;

app.get("/", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  user = { email: req.body.email, name: req.body.name };

  //retrieve or create user
  user = await login(user);

  res.render("home", user);
});

app.get("/search", (req, res) => {
  res.render("search");
});

app.post("/processSearch", async (request, response) => {
  let query = request.body.query;

  //Clear search results
  let searchResults = {
    results: [],
  };

  //Initial query to NASA api
  let apiResponse = await axios.get(`https://images-api.nasa.gov/search?q=${query}`);

  searchResults["totalResults"] = apiResponse.data.collection.metadata.total_hits;
  searchResults["links"] = apiResponse.data.collection.links;

  let urls = apiResponse.data.collection.items.map((item) => {
    return {
      url: item.href,
      title: item.data[0].title,
    };
  });

  let counter = 0;
  Promise.all(
    urls.map((endpoint) =>
      axios.get(encodeURI(endpoint.url)).then((urls) => {
        let nextResult = {};
        //Only create results for images videos (no audio files)
        if (urls.data.find((string) => string.includes("thumb."))) {
          //set thumbnail image
          nextResult["thumb"] = urls.data.find((string) => string.includes("thumb."));

          //search for highest quality video/image available
          //orig video -> large video -> any video
          //orig jpg -> large jpg -> any jpg
          let fullSize = urls.data.find((string) => string.includes("orig.mp4"))
            ? urls.data.find((string) => string.includes("orig.mp4"))
            : urls.data.find((string) => string.includes("large.mp4"))
            ? urls.data.find((string) => string.includes("large.mp4"))
            : urls.data.find((string) => string.includes(".mp4"))
            ? urls.data.find((string) => string.includes(".mp4"))
            : urls.data.find((string) => string.includes("orig.jpg"))
            ? urls.data.find((string) => string.includes("orig.jpg"))
            : urls.data.find((string) => string.includes("large.jpg"))
            ? urls.data.find((string) => string.includes("large.jpg"))
            : urls.data.find((string) => string.includes(".jpg"));

          nextResult["fullSize"] = fullSize;

          //Get title from parent searchResult object
          nextResult["title"] = endpoint.title;
          searchResults.results.push(nextResult);
        }
        counter += 1;
      })
    )
  ).then(() => {
    //Render results
    let thumbnails = "";
    searchResults.results.forEach((result, index) => {
      thumbnails += `<div class="thumb"><a href="/image?index=${index}"><img src="${result.thumb}" id="${index}" alt="${result.title}" /></a>${result.title}</div>`;
    });

    let buttons = "";
    if (searchResults.links) {
      searchResults.links.forEach((link) => {
        let query = link.href.substring(link.href.indexOf("?q="));
        buttons += `<a href="/processSearch/${query}"><button>${link.prompt}</button></a>`;
      });
    }

    response.render("searchResult", { count: searchResults.totalResults, images: thumbnails, navigation: buttons });
  });
});

app.get("/processSearch", (request, response) => {
  let query = request.originalUrl.substring(request.originalUrl.indexOf("?q=") + 3);
  axios({
    method: "post",
    url: "/processSearch",
    data: {
      query: query,
    },
  });
});

//Connect to database
connect();

//Start server
http.createServer(app).listen(port);
process.stdout.write(`Web server started and running at http://localhost:${port}\n`);

process.stdin.on("readable", function () {
  let dataInput = process.stdin.read();
  if (dataInput !== null) {
    let command = dataInput.trim();
    if (command === "stop") {
      process.stdout.write("Shutting down the server\n");
      process.exit(0);
    }
    process.stdin.resume();
  }
});
