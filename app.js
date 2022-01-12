// jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const _=require("lodash");
const port = process.env.PORT || 5000;
const mongoose = require("mongoose");
const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname + "/public")));

//connecting to mongodb
const credentials=__dirname+"/X509-cert-1046118905334779307.pem"
const url = "mongodb+srv://cluster0.vffe1.mongodb.net/myFirstDatabase?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority";
const dbname = "todolistdb";
const connect =mongoose.connect(url,
	{    ssl: true,
		sslValidate: true,
		sslKey: credentials,
		sslCert: credentials},(err,res)=>{
			if(err) console.log("like",err);
			else console.log("rsy",res);
		});
		

//schema for todolist
let today = new Date();
let options = {
	weekday: "long",
	day: "numeric",
	month: "long",
};
let day = today.toLocaleDateString("en-US", options);

//todolist schema
const todolistschema = new mongoose.Schema({
	date: {
		type: String,
	},
	time: {
		type: [String],
	},
	todo: [String],
	what: {
		type: String,
		index:{collation: { locale: 'en_US', strength: 2 }, 
		unique:true,
	}},
});

todolistschema.index({ date: 1, what: 1 }, { unique: true });

//creating collection

const todolist = mongoose.model("todolists", todolistschema);

let datethereornot = async (what) => {
	return await todolist.find({ date: day, what: what }).count();
};

const ins = async (what, item) => {
	let result = 0;
	console.log("got inside isn ", await datethereornot(what));
	if ((await datethereornot(what)) === 0) {
		todolist.insertMany(
			[
				{
					date: day,
					what: what,
					todo: item,
					time: new Date().toLocaleTimeString(),
				},
			],
			(err, result) => {
				if (err) console.log("fff", err);
				else console.log("jins", result);
			}
		);
		result = 1;
	}
	return result;
};

app.get("/",(req,res)=>{


	res.render("home");
});

app.get("/list/:what", async function (req, res) {
	let what =_.capitalize(req.params.what);
	console.log("hiya",what);
	let query = await todolist.find({ date: day });
	let item=[];
	if (query.find((x) => x.what === what) === undefined) { console.log("hi h")
	item.todo = [];
}
	else item=query.find((x) => x.what ===what);
	console.log("hiff",item.todo.length);
	res.render("index", {
		days: day,
		itemm: item,
		title: what,
		rd: "/list/"+what,
	});
});

app.post("/list/:what", async function (req, res) {
	let what =_.capitalize(req.params.what);
	
	console.log("postl " + req.body.items + " " + what);
	let item1 = req.body.items;

	await ins(what, item1);
	todolist
		.findOneAndUpdate(
			{ date: day, what: what},
			{ $push: { todo: item1, time: new Date().toLocaleTimeString() } }
		)
		.exec((err, result) => {
			if (err) console.log(err);
			else console.log("hir " + result);
		});
	res.redirect("/list/"+what);
});


/*app.post("/work", async (req, res) => {
	console.log(req.body);
	let item1 = req.body.items;
	await ins("Work", item1);
	todolist
		.findOneAndUpdate(
			{ date: day, what: "Work" },
			{ $push: { todo: item1, time: new Date().toLocaleTimeString() } }
		)
		.exec((err, result) => {
			if (err) console.log(err);
			else console.log("hiw " + result);
		});
	res.redirect("/work");
});*/

app.post("/delete",async (req, res) => {
  let id_value=req.body.checkbox.split(":");
  let id=id_value[0] 
  let index=id_value[1];
  let what=id_value[2];
  let query = await todolist.find({ _id:id });
  let todo=query.find(x =>x.todo).todo;
	
  console.log(id,index,query.find(x =>x.todo).todo,what);

   todolist.updateOne({_id:id,what:what},{$pull:{todo:todo[index]}},(err,result)=>{
	   if (err)console.log("deletee ",err);
	   else console.log("resulee ",result);
   });
     
  /*
  todolist.updateOne({_id:id},{$pull:{todo}},(err,result)=>{
    if(err) console.log(err);
    else console.log(result);
  });*/

	res.redirect("/list/"+what);
});

app.listen(port, function () {
	console.log(" Server started on port " + port);
});
