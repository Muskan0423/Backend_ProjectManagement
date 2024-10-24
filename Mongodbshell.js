


/* 

title:Abc,
writer:Data,
year:2000,
actors:[Brad,John]

*/

const { db } = require("./models/Usermodel")

 

// To insert a object in collection   
db.movies.insert({title:"Def",writer:"Data",year:"1999",actors:["John","Value"]})

// To find a title in collection
db.movies.find({writer:"Data"})

// To find a movie which is released in year 90s
db.movies.find({year:{$gt:1990,$lt:2000}})

//To find  a movie where it is year before than 1990 or year after 2010
db.movies.find({$or:[{year:{$gt:2010}},{year:{$lt:1990}}]})

//To Update the writer name to harsh if the title is Abc we can also have set instead of push 
db.movies.update({_id:ObjectId("fxfcxsfcxsfcxs")},{$push:{writer:"harsh"}})


