const mongoose = require('mongoose');

exports.connectDatabase = () => {
    mongoose.connect(process.env.MONGO_URL)
    .then((con) => {
        console.log(`Mongoose Successfully Connected on ${con.connection.host}`)
    })
    .catch((error) => {
        console.log(error)
    })
}