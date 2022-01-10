// jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const port = 8000;
const mongoose = require("mongoose");
const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname + "/public")));

//connecting to mongodb
const url = "mongodb://localhost:27017/";
const dbname = "todolistdb";
const connect = mongoose.connect(url + dbname);

//schema for todolist
let today = new Date();
let options = {
  weekday: "long",
  day: "numeric",
  month: "long",
};
let day = today.toLocaleDateString("en-US", options);
let timeday = today.toLocaleTimeString(); // 11:18:48 AM
let timestamp = today.toLocaleString(); // 1/10/2022, 2:49:17 PM

//todolist schema
const todolistschema = new mongoose.Schema({
  date: {
    type: String,
  },
  time:{
    type:[String]
  },
  todo: [String],
  what: {
    type: String,
    enum: ["Personal", "Work"],
  },
});


todolistschema.index({date:1,what:1},{unique:true});
//creating collection

const todolist = mongoose.model("todolists", todolistschema);


let datethereornot = async (what) => {
  return await todolist.find({ date: day,what:what }).count();
};

const ins = async (what) => {
  let result=0;
  console.log("got inside isn ",await datethereornot(what));
  if ((await datethereornot(what)) === 0) {
    todolist.insertMany([
      {
        date: day,
        what: what,
       
      },
    ], (err, result) => {
      if (err)
        console.log("fff",err);

      else
        console.log("jins",result);
    });
    result=1;
  }
  return result;
};

app.get("/", async function (req, res) {
  let query=await todolist.find({date:day});
  let item=query.find(x => x.what==="Personal");
  if(item===undefined)
  item=[];
  else
  item=query.find(x => x.what==="Personal").todo;
  //console.log("hiff",query.find(x => x.what==="Personal").todo);
  res.render("index", {
    days: day,
    itemm: item,
    title: "List",
    rd: "/",
  });
});

app.post("/", async function (req, res) {
  console.log("postl " + req.body.items + " " + day);
  let item1 = req.body.items;

 ins("Personal");
  await todolist.findOneAndUpdate(
    { date: day, what: "Personal" },
    { $push: { todo: item1, time: timeday } }).exec(
      (err, result) => {
        if (err)
          console.log(err);
        else
          console.log("hir " + result);
      }
    );
  res.redirect("/");
});

app.get("/work", async (req, res) => {
  let query=await todolist.find({date:day});
  let workitem=query.find(x => x.what==="Work");
  console.log("welcome to work");
  if(workitem===undefined)
  workitem=[];
  else
  workitem=query.find(x => x.what==="Work").todo;
  res.render("index", {
    title: "work",
    itemm: workitem,
    days: day,
    rd: "/work",
  });
});
app.post("/work", async (req, res) => {
  console.log(req.body);
  let item1 = req.body.items;
  ins("Work");
  await todolist.findOneAndUpdate(
    { date: day,what:"Work" },
    { $push: { todo: item1,time:timeday } }).exec(
    (err, result) => {
      if (err) console.log(err);
      else console.log("hiw " + result);
    }
  );
  res.redirect("/work");
});

app.listen(port, function () {
  console.log(" Server started on port " + port);
});
