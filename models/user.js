"use strict";

const bcrypt = require('bcrypt-nodejs');
const marked = require('marked');
Promise.promisifyAll(bcrypt);

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    username: {//alphanumeric username, suitable for routes
      type: DataTypes.STRING,
      unique: true,
      index:true,
      len: [2,32],
      validate: {
        is: /^[a-z0-9_-]+$/i
      }
    },
    name: { // will display on blog posts, etc
      type: DataTypes.STRING,
    },
    bio: {
      type: DataTypes.TEXT
    },
    $bio: {
      type: DataTypes.VIRTUAL,
      get: function(){
        if(!this.bio) return null;
        return marked(this.bio);
      }
    },
    password: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: true
      }
    },
    admin: { // just in case at some point in the future I need other users for this blasted thing
      type: DataTypes.BOOLEAN
    },
    url: {
      type: DataTypes.VIRTUAL,
      get: function(){
        return '/u/' + this.getDataValue('username')
      }
    }
  }, {
    classMethods: {
      associate: function(models) {

        User.hasMany(models.Image, {
          foreignKey: 'imageable_id',
          constraints: false,
          scope: {
            imageable: 'User'
          },
          onDelete: 'cascade',
        });
        
        User.hasMany(models.BlogPost, {
          constraints:false
        });

        User.hasMany(models.Skill)

        User.addScope('defaultScope', {
          order: [['createdAt','ASC']],
          include: [{model:models.Image, order:[['order','ASC']], limit:1}]
        }, {override: true})

        User.addScope('images', {
          order: [['createdAt','ASC']],
          include: [{model:models.Image}]
        })

        User.addScope('skills', {
          order: [['proficiency','DESC'],['start_date','ASC']],
          include: [{model:models.Skill}]
        })
        
      },
    }
  });

  User.validPassword = function(password, passwd, user) {
    return bcrypt.compareAsync(password, passwd)
    .then(isMatch => {
      if(isMatch) return user
      return false
    })
  };

  function hashPassWord(user, options) {
    return Promise.try(()=>{
      if(user.password && !user.changed('password')) return user; // if password wasn't changed, skip the password hashing
      console.log('hashing password')

      options.updatesOnDuplicate = options.updatesOnDuplicate || [];
      options.updatesOnDuplicate.push('password');

      return bcrypt.genSaltAsync(CONFIG.security.SALT_WORK_FACTOR)
      .then(salt => {
        return bcrypt.hashAsync(user.password, salt, null)
        .then(hash => {
          user.password = hash
          return user
        })
      })
    })
  }

  User.hook('beforeSave', hashPassWord);
  User.hook('beforeCreate', hashPassWord);
  User.hook('beforeUpdate', hashPassWord);

  return User;
};
