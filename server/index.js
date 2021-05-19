const express = require("express");
const cors = require("cors");
var solr = require('solr-client');
var UUID = require('uuid-js');

const PORT = process.env.PORT || 3002;

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


var clientTest = solr.createClient('localhost', '8983', 'test');
var clientComment = solr.createClient('localhost', '8983', 'comment');
var clientReply = solr.createClient('localhost', '8983', 'reply');

function test() { 
	var done = false;
	var data = [];
	var query = clientTest.createQuery().q('*:*').fl('id');
	clientTest.search(query,function(err,obj){
		if(err){
			console.log(err);
		}else{
//			console.log(obj);
			data = obj.response.docs;
		}
		done = true;
	});
	require('deasync').loopWhile(function(){return !done;});
	return data;
}

function commit (solrclient) {
	var done = false;
	solrclient.softCommit(function(err,res){
	   if(err){
	   	console.log(err);
	   }else{
	   	console.log(res);
	   }
	done = true
	});
	require('deasync').loopWhile(function(){return !done;});
}


app.get("/test", (req, res) => {

	var done = false;
	var data = [];
	var query = clientTest.createQuery().q('*:*').fl('id');
	clientTest.search(query,function(err,obj){
		if(err){
			console.log(err);
		}else{
			data = obj.response.docs;
		}
		done = true;
	});
	require('deasync').loopWhile(function(){return !done;});

  console.log(data);
  res.send({ comments: data });
});

app.get("/comments", (req, res) => {

	var done = false;
	var data = [];
	var query = clientComment.createQuery().q('*:*').fl('id,name,comment,created_at').sort({created_at : 'desc' });
	clientComment.search(query,function(err,obj){
		if(err){
			console.log(err);
		}else{
			data = obj.response.docs;
		}
		done = true;
	});
	require('deasync').loopWhile(function(){return !done;});

//  console.log(data);
  res.send({ comments: data });
});

app.post("/comment", (req, res) => {
 
  const name = req.body.name;
  const comment = req.body.comment;
  
  var id = UUID.create(1);
  var doc = {
	id : id.toString(),
  	name: name,
  	comment: comment,
  	created_at : new Date(),
  };
  
	var done = false;
	clientComment.add(doc,function(err,obj){
	   if(err){
	      console.log(err);
	   }else{
	      console.log(obj);
	      commit(clientComment);
	      console.info("upsert successfully in <<<<<<<<<comment>>>>>>>>");
	   }
	done = true;
	});
	require('deasync').loopWhile(function(){return !done;});
		
  res.send(doc);
  
});



app.get("/replys", (req, res) => {

  const parent_id = req.query.id;

	var done = false;
	var data = [];
	var query = clientReply.createQuery().q('*:*')
				.fl('id,name,comment,created_at')
				.matchFilter('parent_id', parent_id)
				.sort({created_at : 'desc' });
	clientReply.search(query,function(err,obj){
		if(err){
			console.log(err);
		}else{
			data = obj.response.docs;
		}
		done = true;
	});
	require('deasync').loopWhile(function(){return !done;});

//  console.log(data);
  res.send({ replys: data });
});


app.post("/reply", (req, res) => {
 
  const name = req.body.name;
  const comment_id = req.body.comment_id;
  const parent_id = req.body.parent_id;
  const comment = req.body.comment;
  
  var id = UUID.create(1);
  var doc = {
	id : id.toString(),
  	name: name,
  	comment_id: comment_id,
  	parent_id: parent_id,
  	comment: comment,
  	created_at : new Date(),
  };
  
	var done = false;
	clientReply.add(doc,function(err,obj){
	   if(err){
	      console.log(err);
	   }else{
	      console.log(obj);
	      commit(clientReply);
	      console.info("upsert successfully in <<<<<<<<<Reply>>>>>>>>");
	   }
	done = true;
	});
	require('deasync').loopWhile(function(){return !done;});
		
  res.send(doc);
  
});



app.listen(PORT, () => {
  console.log('Server listening on 3002');
});
