'use strict';

const Sequelize = require('sequelize');
require('sequelize-hierarchy')(Sequelize);

if(CONFIG.database.uri) {
  var sequelize = new Sequelize(CONFIG.database.uri, CONFIG.database.options)
} else {
  var sequelize = new Sequelize(CONFIG.database.name, CONFIG.database.username, CONFIG.database.password, CONFIG.database.options)
}

sequelize.authenticate()

module.exports = sequelize
