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
				var collection = db.collection('updates');
				var collectionb = db.collection('users');
				collection.find({notify:{$elemMatch:{user:req.cookies.username}}}).toArray(function(err, result){
					if(err){
						console.log(err)
					} else {
						for(var i = 0; i< result.length; i++){
							result[i].time = Math.floor((new Date().getTime())/3600000 - result[i].time);
						}
						console.log(result);
						collectionb.find({username:req.cookies.username}).toArray(function(err, user){
							if (err){
								console.log(err);
							}else{
								if(user[0].admin){
									db.close();
									if (error && !(req.cookies.isAdmin)){
										res.cookie('isAdmin',true, {expire:new Date() + 9999}).render('home2',{updates:result, username:req.cookies.username, isAdmin:true, error:error});
									} else if (!(req.cookies.isAdmin) && !(error)){
										res.cookie('isAdmin',true, {expire:new Date() + 9999}).render('home2',{updates:result, username:req.cookies.username, isAdmin:true});
									} else if (error){
										res.render('home2',{updates:result, username:req.cookies.username, isAdmin:true, error:error});
									} else {
										res.render('home2',{updates:result, username:req.cookies.username, isAdmin:true});
									}
								} else {
									db.close();
									if(error){
										res.render('home2',{updates:result,username:req.cookies.username, error:error});
									} else {
										res.render('home2',{updates:result,username:req.cookies.username});
									}
								}

							}
						});
					}
				});
			}
		});
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
							if (req.cookies.isAdmin){
								res.clearCookie('groupname').render('groups',{groups:allGroups, error:req.cookies.error, isAdmin:true});
							} else {
								res.clearCookie('groupname').render('groups',{groups:allGroups, error:req.cookies.error});
							}
						} else {
							if (req.cookies.isAdmin){
								res.clearCookie('groupname').render('groups',{groups:allGroups, isAdmin:true});
							} else {
								res.clearCookie('groupname').render('groups',{groups:allGroups});
							}
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
router.post('/makeGroup', function(req, res){
	var groupName = req.body.name;
	var MongoClient = mongodb.MongoClient;
	url = 'mongodb://localhost:27017/things';
	console.log('loading');
	MongoClient.connect(url, function(err, db){
		if(err){
			console.log(err);
		}else{
			var collection = db.collection('groups');
			collection.find({name:groupName},function(err, result){
				if(err){
					console.log(err);
				}else if(result.length){
					res.cookie("error", "group name already taken", {expire: new Date() + 9999}).redirect(303,'groups');
				}else {
					collection.find({}).toArray(function(err, results){
						if(err){
							console.log(err)
						}else{
							collection.insert({name:groupName, id:results.length+1,owner:req.cookies.username,users:[{user:req.cookies.username}],items:[{id:1,item:"example",qty:2,description:"this is an example"}]}, function(err, result){
								if(err){
									console.log(err);
								} else{
									res.clearCookie("error").redirect(303,"/groups");
								}
							});
						}
					})
				}
			});
		}
	});
})
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
						if(req.cookies.isAdmin){
							if(req.cookies.username === result[0].owner && error){
								res.render('group',{group:result[0].items, users:result[0].users,owner:result[0].owner, isAdmin:true, isOwner:true, error:error});
							} else if(!(req.cookies.username === result[0]) && error){
								res.render('group',{group:result[0].items, users:result[0].users,owner:result[0].owner, isAdmin:true, error:error});
							} else if (req.cookies.username === result[0]){
								res.render('group',{group:result[0].items, users:result[0].users,owner:result[0].owner, isAdmin:true, isOwner:true});
							} else {
								res.render('group',{group:result[0].items, users:result[0].users,owner:result[0].owner, isAdmin:true});
							}
						} else {
							if(req.cookies.username === result[0].owner && error){
								res.render('group',{group:result[0].items,owner:result[0].owner, users:result[0].users, isOwner:true, error:error});
							} else if(!(req.cookies.username === result[0].owner) && error){
								res.render('group',{group:result[0].items,owner:result[0].owner, users:result[0].users, error:error});
							} else if(req.cookies.username === result[0].owner){
								res.render('group',{group:result[0].items,owner:result[0].owner, users:result[0].users, isOwner:true});
							} else {
								res.render('group',{group:result[0].items,owner:result[0].owner, users:result[0].users, error:error});
							}
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
router.post('/delete', function(req, res){
	var MongoClient = mongodb.MongoClient;
	url = 'mongodb://localhost:27017/thing';
	var groupname = req.cookies.groupname;
	MongoClient.connect(url, function(req, res){
		if (err){
			console.log(err);
		} else {
			var collection = db.collection('groups');
			collection.remove({name:groupname},function(err, result){
				
			});
		}
	});
});
router.post('/transfer', function(req, res){
	var MongoClient = mongodb.MongoClient;
	url = 'mongodb://localhost:27017/things';
	var groupname = req.cookies.groupname;
	var newOwner = req.body.transfer;
	MongoClient.connect(url, function(err, db){
		if (err){
			console.log(err);
		} else {
			var collection = db.collection('groups');
			collection.find({name:groupname, users:{$elemMatch:{user:newOwner}}}).toArray(function(err, result){
				if (err){
					console.log(err);
				} else if (result.length) {
					collection.updates({name:groupname}, {$set:{owner:newOwner}}, function(err, records){
						if (err){
							console.log(err);
						} else {
							res.redirect('/group')
						}
					});
				} else {
					res.cookie('error', 'user not in inventory', {expire:new Date() + 9999}).redirect(303, 'group');
				}
			});
		}
	});
});
router.post('/addRemove', function(req, res){
	var MongoClient = mongodb.MongoClient;
	var url = "mongodb://localhost:27017/things"
	var method = req.body.method;
	var item = req.body.item;
	var groupname = req.cookies.groupname;
	var description = req.body.description;
	var qty = req.body.qty;
	MongoClient.connect(url, function(err, db){
		if(err){
			console.log(err);
		} else {
			var collection = db.collection('groups');
			var collectionb = db.collection('updates')
			if(method === 'add'){
				collection.find({name:groupname ,items:{$elemMatch:{item:item, description:description}}}).toArray(function(err, result){
					if(err){
						console.log(err);
					} else if(result.length){
						var newQty = result[0].items.find(function(element){
							return element.item === item && element.description === description;
						});
						items = result[0].items
						console.log(parseInt(items[items.indexOf(newQty)]), parseInt(qty))
						items[items.indexOf(newQty)].qty = JSON.stringify(parseInt(items[items.indexOf(newQty)].qty)+parseInt(qty)); 	
						collection.update({name:groupname},{$set:{items:items}},function(err, records){
							if (err){
								console.log(err)
							} else {
								var time = (new Date().getTime())/3600000;
								collectionb.insert({elements:1,affect:"updated",user:req.cookies.username,inventory:groupname,time:time,notify:result[0].users}, function(err, result){
									if (err){
										console.log(err)
									} else{
										db.close();
									}
								})
								res.redirect(303, '/group')
							}
						});
					} else {
						collection.find({name:groupname}).toArray(function(err,result){
							if(err){
								console.log(err);
							}else if(result.length){
								items = result[0].items
								collection.update({name:groupname},{$push:{items:{item:item,qty:qty,description:description,id:items.length+1}}}, function(err, result){
									if(err){
										console.log(err);
									} else {
										var time = Date.now/60000
										collection.find({name:groupname}).toArray(function(err, result){
											if(err){
												console.log(err)
											} else {
												var time = (new Date().getTime())/3600000
												collectionb.insert({elements:qty,affect:"added",user:req.cookies.username,inventory:groupname,time:time,notify:result[0].users}, function(err, result){
													if (err){
														console.log(err);
													} else {
														db.close();
													}
												})
											}
										})	
										res.redirect(303, '/group');
									}
								});
							}
						});
						
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
						if (parseInt(items[items.indexOf(newQty)].qty)-parseInt(qty) <= 0){
							var loc = items.indexOf(newQty);
							items.splice(items.indexOf(newQty));
							for(var i = loc + 1;i<items.length;i++){
								items[i].id --;
							}
						} else {
							items[items.indexOf(newQty)].qty = JSON.stringify(parseInt(items[items.indexOf(newQty)].qty)-parseInt(qty));
						}
						collection.update({name:groupname},{$set:{items:items}},function(err, records){
							if(err){
								console.log(err);
							} else {
								var time = (new Date().getTime())/3600000;
								collectionb.insert({elements:qty,affect:"removed",user:req.cookies.username,inventory:groupname,time:time,notify:result[0].users}, function(err, result){
									if(err){
										console.log(err);
									} else {
										db.close();
										res.redirect(303, '/group');
									}
								});
								
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
});
router.get('/admin', function(req,res){
	if(req.cookies.username && req.cookies.isAdmin){
		res.render('admin', {isAdmin:true})
	} else if(req.cookies.username){
		res.cookie('error', 'you are not an admin :(', {expire: new Date + 9999}).redirect(303,'/home2');
	} else {
		res.redirect(303, '/signin');
	}
});
router.post('/invite', function(req, res){
	var username = req.body.usr;
	var MongoClient = mongodb.MongoClient;
	var groupname = req.cookies.groupname
	var url = "mongodb://localhost:27017/things"
	MongoClient.connect(url, function(err, db){
		var collection = db.collection("groups");
		collection.find({name:groupname}).toArray(function(err, result){
			if(err){
				console.log(err);
			} else if(result.length) {
				var users = result[0].users
				var isIn = users.find(function(element){
					return element.user = username;
				})
				if(isIn === -1){
					collection.update({name:groupname},{$push:{users:{user:username}}},function(err, result){
						if (err){
							console.log(err);
						} else {
							res.redirect(303, '/group');
						}
					})
				}
			} else {
				res.cookie("error","user "+username+" does not exist").redirect(303,'/group')
			}
		})
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
	if(req.cookies.username && req.cookies.isAdmin){
		res.render('about2', {title:"about", isAdmin:true});
	} else if(req.cookies.username){
		res.render("about2", {title:"about"});
	} else {
		res.redirect(303, '/signin');
	}
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
