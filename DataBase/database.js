

const Sequelize = require('sequelize');

const sequelize = new Sequelize('School','myserver','nishtha!123A',{
    host:"myserver3456.mysql.database.azure.com",
    dialect:"mysql"
});

module.exports = sequelize;
