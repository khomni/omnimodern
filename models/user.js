"use strict";

const bcrypt = require('bcrypt-nodejs');
Promise.promisifyAll(bcrypt)

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    // identifier: {
    //   type: DataTypes.STRING,
    //   primaryKey: true
    // },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isAlphanumeric: true,
        len: [2,16]
      }
    },
    url: {
      type: DataTypes.VIRTUAL,
      get: function(){
        return '/u/' + this.username
      }
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: true
      }
    },
    admin: {
      type: DataTypes.BOOLEAN
    }
  }, {
    scopes: {
      public: {
        attributes: {exclude: ['password','email']}
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
    ],
    classMethods: {
      associate: function(models) {
        
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

  User.hook('beforeSave', function(user, options) {
    return Promise.try(()=>{
      if(!user.changed('password')) return user; // if password wasn't changed, skip the password hashing

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
  });
  return User;
};
