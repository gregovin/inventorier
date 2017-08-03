&ensp; using terminal go to the folder were the site was downloaded  
&ensp; install hombew(google it)  
&ensp; install npm  
brew install npm  
npm install  
&ensp; install node(google it)  
&ensp; install required modules  
npm install jade -g  
npm install --save express  
npm install --save mongodb  
npm install --save body-parser  
npm install --save cookie-parser  
npm install --save formidable  
npm install --save fs  
npm install --save express-session  
npm install --save parseurl  
npm install --save mongo-sanitize  
&ensp; start the mongodb server  
mongod <data folder path, just drag and drop it into terminal>  
&ensp; start and initialize mongodb(in the site directory and in a new tab)  
mongo  
use things  
db.users.insert([{username:<your username>, password: <console.log() hash on your password in routes/index.js and paste it here>, email: <your email>, admin: true, bannedTil:null, profileImg:'/images/profiles/default.png'}])  
&ensp; note: all input feilds for the insert should be strings exept password, admin, and bannedTil  
&ensp; start the server  
npm start  
