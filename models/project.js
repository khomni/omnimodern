"use strict";

module.exports = function(sequelize, DataTypes) {
  var Project = sequelize.define("Project", {

    url: { // a routeable URL for this project
      type: DataTypes.STRING,
      unique: true,
      index:true,
      set: function(val) {
        val = val.replace(/[^a-zA-Z0-9_-\s]/gi,'').split(/\s+/).reduce((a,b) => { // make sure only complete words are encoded
          var length = a.reduce((a,b) => {return a+b.length+1},0)
          if(length + b.length < 32) a.push(b)
          return a
        },[]).join('-')
        this.setDataValue('url', val)
      },
    },

    title: { // The Title of the Project
      type: DataTypes.STRING
    },

    // the type of project
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: { // a synopsis of the summary
      type: DataTypes.TEXT,
    },

    status: {
      type: DataTypes.ENUM,
      defaultValue: 'planning',
      values: ['planning', 'in progress', 'suspended', 'abandoned', 'finished']
    },

    archived: {
      type:DataTypes.BOOLEAN,
      defaultValue: false,
    }
  }, {
    defaultScope: {
      order: [['createdAt','DESC']]
    },
    classMethods: {
      associate: function(models) {
        
        Project.hasMany(models.BlogPost);

        Project.hasMany(models.Image, {
          // as: 'images',
          foreignKey: 'imageable_id',
          constraints: false,
          scope: {
            imageable: 'Project'
          },
        });
      }
    }
  });


  return Project;
};
