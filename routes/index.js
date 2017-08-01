var express = require('express');
var router = express.Router();
var mongodb =require('mongodb');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var formidable = require('formidable')
var credentials = require('./credentials.js');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var fs = require('fs')
var session = require('express-session');
var parseurl = require('parseurl');
router.use(require('body-parser').urlencoded({extended:true}));
router.use(require('cookie-parser')(credentials.cookieSecret));
router.use(express.static(__dirname + '/public'))

var hash = function(plaintext){
	var encoded = '';
		for(var i = 0; i < plaintext.length; i++){
			encoded += plaintext.charCodeAt(i);
		}
		var hash = 0;
		var messer = 123456789;
		for(var i = 0; i < encoded.length; i++){
			switch (encoded.charAt(i)){
			case '1':
				hash = (Math.round(hash * messer /2) + 9)^2 % 1e10;
				messer = (hash * messer + 314159265) %1e10;
				break;
			case '2':
				hash = (Math.round(Math.sqrt(messer)) + hash + hash * 6022) % 1e10;
				messer = (Math.abs(hash - messer)*98765 + 9876543) % 1e10;
				break;
			case '3':
				hash = (messer * messer * messer * 3 + hash + hash * hash * 2 * messer) % 1e10;
				messer = ((messer + hash * hash * 2) * messer + messer * 9876543) % 1e10;
				break;
			case '4':
				hash = (messer + hash * 12345678 + messer * messer * messer * 8) % 1e10;
				messer = (271828182 * hash + 314159265 * messer) %1e10;
				break;
			case '5':
				hash = Math.abs(hash*161803399 - messer*271828182 + 314159265) % 1e10;
				messer = (messer * 123456789 + 987654321 * hash + 567890123) % 1e10; 
				break;
			case '6':
				hash = ((hash + 9) * hash * messer) % 1e10;
				messer = ((messer + 102384) * messer) % 1e10;
				break
			case '7':
				hash = (555555555 * hash + 55555555 * messer) % 1e10;
				messer = (111111111 * hash + 11111111 * messer) % 1e10;
				break;
			case '8':
				hash = (hash * messer + messer + messer * messer * 2)% 1e10;
				messer = ((hash + 123456 * messer) * 348)% 1e10;
				break;
			case '9':
				hash = Math.abs(161803398 * hash - 314159265 * messer) % 1e10;
				messer = Math.abs(271828182 * hash - 314159265 * messer) % 1e10;
				break;
			case '0':
				hash = (161803398 * hash + 314159265 * messer + 271828192 * hash * hash * 2 + 123456789 * messer * messer * 2)% 1e10;
				messer = (314159265 * hash + 123456789 * messer + 314159265 * hash * hash * 2 + 271828192 * messer * messer * 2)% 1e10
			}
		if(hash < 0){
			hash = Math.abs(hash);
		}
		if(messer < 0){
			messer = Math.abs(messer);
		}
	}
	return hash;
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home', { title: 'home' });
});
router.get('/createAcount', function(req, res){
	if (!req.cookies.error){
		res.render('signup', {title: 'sign up'});
	} else {
    res.render('signup', {title: 'sign up' ,error:req.cookies.error});
}
});
router.get('/home2', function(req, res){
	if(req.cookies.username){
		var MongoClient = mongodb.MongoClient;
		var url = 'mongodb://localhost:27017/things'
		MongoClient.connect(url, function(err, db){
			if(err){
				console.log(err);
			} else {
				var collection = db.collection('updates')
				collection.find({notify:{$elemMatch:{user:req.cookies.username}}}).toArray(function(err, result){
					if(err){
						console.log(err)
					} else {
						var allUpdates = [];
						console.log(result);
						res.render('home2', {username: req.cookies.username, updates : result})
						db.close();
					}
				});
				
			}
		})
		
	} else {
		res.clearCookie('error').redirect(303, 'signin')
	}
});
router.get('/groups', function(req, res){
	if(req.cookies.username){
		var MongoClient = mongodb.MongoClient;
		url = 'mongodb://localhost:27017/things';
		console.log('loading');
		MongoClient.connect(url, function(err, db){
			if (err){
				console.log(err);
			} else {
				var collection = db.collection('groups');
				collection.find({users:{$elemMatch:{user:req.cookies.username}}}).toArray(function(err, result){
					if(err){
						console.log(err);
					}else{
						var allGroups = []
						for(var i = 0; i< result.length; i++){
							allGroups.push({name:result[i].name, updates:result[i].updates});
						}
						console.log(allGroups)
						if (req.cookies.error){
							res.clearCookie('groupname').render('groups',{groups:allGroups, error:req.cookies.error});
						} else {
							res.clearCookie('groupname').render('groups',{groups:allGroups});
						}
						db.close()
					}
				})
			}
		})
	} else {
		res.redirect(303, 'signin')
	}
});
router.post('/groupSel', function(req, res){
	if(req.cookies.username){
		var MongoClient = mongodb.MongoClient;
		url = 'mongodb://localhost:27017/things';
		var groupname = req.body.groupsub
		console.log(groupname);
		res.cookie('groupname', groupname, {expire:new Date() + 9999}).redirect(303, '/group')
	} else{
		res.redirect(303, 'signin');
	}
});
router.get('/group', function(req, res){
	if(req.cookies.username){
		var MongoClient = mongodb.MongoClient;
		url = 'mongodb://localhost:27017/things';
		var groupname = req.cookies.groupname;
		MongoClient.connect(url, function(err, db){
			if (err){
				console.log(err)
			} else {
				var collection = db.collection('groups');
				collection.find({name:groupname}).toArray(function(err, result){
					if(err){
						console.log(err);
					} else if(result.length) {
						if (req.cookies.error){
							res.render('group',{group:result[0].items, error:req.cookies.error})
						} else {
							res.render('group',{group:result[0].items})
						}
						db.close();
					} else {
						db.close()
						res.cookie('error', 'group does not exist', {expire: new Date() + 9999}).redirect(303, '/groups');
					}
				});

			}
		});
	} else {
		res.redirect(303, 'signing');
	}
});
router.post('/addRemove', function(req, res){
	var MongoClient = mongodb.MongoClient;
	var url = "mongodb://localhost:27017/things"
	var method = req.body.method;
	var item = req.body.item;
	var groupname = req.cookies.groupname;
	var qty = req.body.qty;
	MongoClient.connect(url, function(err, db){
		if(err){
			console.log(err);
		} else {
			var collection = db.collection('groups');
			if(method === 'add'){
				collection.find({name:groupname ,items:{$elemMatch:{item:item}}}).toArray(function(err, result){
					if(err){
						console.log(err);
					} else if(result.length){
						var newQty = result[0].items.find(function(element){
							return element.item === item
						});
						items = result[0].items
						items[items.indexOf(newQty)].qty += qty; 
						console.log(newQty);
						collection.update({name:groupname},{$set:{items:items}},function(err, records){
							if (err){
								console.log(err)
							} else {
							db.close();
							res.redirect(303, '/group')
							}
						});
						
					} else {
						collection.update({items:{$elemMatch:{item:item}}},{$push:{item:item,qty:qty}}, function(err, res){
							if(err){
								console.log(err);
							} else {
								db.close();
								res.redirect(303, '/group');
							}
						})
					}
				});
			} else if(method === 'remove'){
				collection.find({name:groupname, items:{$elemMatch:{item:item}}}).toArray(function(err, result){
					if (err){
						console.log(err);
					} else if (result.length) {
						var newQty = result[0].items.find(function(element){
							return element.item === item
						});
						items = result[0].items
						if (items[items.indexOf(newQty)] - qty <= 0){
							items.splice(items.indexOf(newQty));
						} else {
							items[items.indexOf(newQty)] -= qty;
						}
						collection.update({name:groupname},{$set:{items:items}},function(err, res){
							if(err){
								console.log(err);
							} else {
								db.close();
								res.redirect(303, '/group');
							}
						});
					} else {
						res.cookie('error', "item does not exist").redirect(303, '/group');
					}
				});
			} else {
				console.log('this is a bad method somehow:', method)
			}
		}
	})
})
router.get('/logout', function(req,res){
	res.clearCookie('username').clearCookie("error").redirect(303, '/')
});
router.post('/adduser', function(req, res){
	var MongoClient = mongodb.MongoClient;
	var url = 'mongodb://localhost:27017/things';
	MongoClient.connect(url, function(err, db){       // Connect to the server
		if (err) {
			console.log('Unable to connect to the Server:', err);
		} else {
			console.log('Connected to Server');
			var collection = db.collection('users');
			console.log(req.body.usr);
			var querry = {username:req.body.usr};
			var nameTaken = false;
			if(req.body.psw === req.body.confirmPsw){ // Get the documents collection
				var user1 = {username: req.body.usr, password: hash(req.body.psw), // Get the student data    	city: req.body.city, state: req.body.state, sex: req.body.sex,
				email: req.body.email};
				collection.find(querry).toArray(function(err, result){
						if(err){
							console.log(err);
						} else if(result.length){
							db.close();
									res.cookie("error", "username taken", {expire: new Date + 9999}).redirect(303, 'createAcount');
						} else {
							collection.insert([user1], function (err, result){	    // Insert the student data
								if (err) {
									console.log(err);
								} else {
									db.close();
									res.clearCookie("error").redirect(303, "signin");
								}

							});
						}
					});

				return ;
			} else {
				db.close()
				res.cookie("error", "password must match confirm password").redirect(303, '/createAcount');
				return ;
			}
		}
	});
});
router.get('/signin', function(req,res){
	if (req.cookies.error){
		res.render('signin', {error:req.cookies.error})
	}else{
		res.render('signin')
	}
});
router.post('/proccesSignIn', function(req,res){
	var MongoClient = mongodb.MongoClient;
	var url = 'mongodb://localhost:27017/things';
	MongoClient.connect(url, function(err, db){
		if (err){
			console.log("failed to connect to mongodb server:", err)
		} else {
			console.log('connected to server')
			var collection = db.collection('users');
			collection.find({username:req.body.usr, password:hash(req.body.psw)}).toArray(function(err, result){
				if(err){
					console.log(err);
				} else if(result.length){
					res.clearCookie('error').cookie("username", result[0].username, {expire:new Date()+9999}).redirect(303, 'home2');
				} else {
					res.cookie("error", "username and/or password is incorect", {expire:new Date() + 9999}).redirect(303, 'signin');
				}
			});
		}
	})
});
router.get('/about', function(req, res){
	res.render('about', {title:"about"});
});
router.get('/about2', function(req, res){
	res.render('about2', {title:"about"});
});
router.get('/thelist', function(req, res){
var MongoClient = mongodb.MongoClient;
var url = 'mongodb://localhost:27017/things';    // Define where the MongoDB server is
MongoClient.connect(url, function (err, db) {// Connect to the server
  if (err) {
    console.log('Unable to connect to the Server', err);
  } else { 		// We are connected
console.log('Connection established to', url);
    // Get the documents collection
    var collection = db.collection('users');
collection.find({}).toArray(function(err, result){// Find all students
      if (err) {
        res.send(err);
      } else if (result.length) {
        res.render('studentlist',{
          // Pass the returned database documents to Jade
          "studentlist" : result
        });
      } else {
        res.send('No documents found');
      }
db.close(); //Close connection
    });    } 	});	});

module.exports = router;
