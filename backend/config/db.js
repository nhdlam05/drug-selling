
const mongoose = require('mongoose');

const connect = () => {
    mongoose.connect('mongodb://admin:password@localhost:27017/db_drug')
        .then(() => {
            console.log("Connect to db successfully");
        })
        .catch((err) => console.log("Cannot connect to DB"));
}
module.exports = connect;