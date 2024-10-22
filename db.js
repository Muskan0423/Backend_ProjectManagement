const mongoose = require('mongoose');
// const mongoURI = "mongodb://0.0.0.0:27017/";
// const mongoURI = "mongodb+srv://harsh:Harsh9945khosla@cluster0.osfevs6.mongodb.net/muskan";
// const mongoURI = "mongodb+srv://muskankewlani123:muskan@cluster0.vhwewr7.mongodb.net/";
const mongoURI ="mongodb+srv://muskankewlanicimet:Vgj0O4kXtR5y84wn@cluster0.ebuz8.mongodb.net/test"

const ConnectToMongo = async () => {
    try {
        await mongoose.connect(mongoURI, {
        });
        console.log("Connected to MongoDB");
    } catch (error) {  
        console.error("Error connecting to MongoDB:", error.message);
    }
};

module.exports = ConnectToMongo;



