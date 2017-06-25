'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(module.filename);
const env = process.env.NODE_ENV || 'development';
const sequelize = require(APPROOT+'/config/database');
const EventEmitter = require('events')

let db = {};

db._connection = new EventEmitter();

db._associate = function(){
  for(let key in db) {
    if(db[key].associate) {
      db[key].associate(db)
    }
  }
}

// associates the models and syncs to the database
db._sync = Promise.method(() => {
  db._associate();

  return Promise.try(()=>{
    if(CONFIG.database.forcesync) return sequelize.drop()
    return;
  })
  .then(() => sequelize.sync() )
  .catch(err => {
    console.log(err)
    return null;
  })
  .then(syncResults => {
    // individually check to make sure the model associations are valid
    return syncResults;
  })
})

db._methods = function(doc,regex) {
  let methods = []
  for(let key in doc) if(typeof doc[key] == 'function') methods.push(key)
  if(regex && regex instanceof RegExp) methods = methods.filter(method => {return regex.test(method)})
  process.stdout.write(methods.sort().join(', ').grey + '\n')
  return methods
}

sequelize.authenticate()
.then(() => {
  
  fs.readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== basename) && ((file.slice(-3) === '.js') || (file.indexOf('.') < 0));
  })
  .forEach(function(file) {
    let model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model
  });

  db._sync()
  .then(models => {
    db._connection.synced = true
    db._connection.emit('synced')
  })

})
.catch(err => db._connection.emit('error', err) )

module.exports = db

module.exports.sequelize = sequelize;
module.exports.Sequelize = Sequelize;
