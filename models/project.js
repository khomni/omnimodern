"use strict";

const marked = require('marked');
const cheerio = require('cheerio');

module.exports = function(sequelize, DataTypes) {
  var Project = sequelize.define("Project", {
    path: {
      type:DataTypes.VIRTUAL,
      get: function(){
        return '/portfolio/' + this.url
      }
    },
    url: { // a routeable URL for this project
      type: DataTypes.STRING,
      unique: true,
      index: true,
      allowNull: false,
      validate: {
        is: /^[a-z0-9_-]+$/i
      }
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
    $description: {
      type: DataTypes.VIRTUAL,
      get: function() {
        if(!this.description) return null;
        let processedBody = this.description
        if(this.Images) {
          processedBody += '\r' + this.Images.map((image, i) => `[${i}]: ${image.path}`).join('\n')
        }
        return marked(processedBody)
      }
    },
    $description_preview: {
      type: DataTypes.VIRTUAL,
      get: function(){
        if(!this.description) return null;
        let $ = cheerio.load(this.$description, {withDomLvl1: false});
        let preview = $.html($('body').find('p,h3,h4,h5').slice(0,3))
        return preview
      }
    },
    status: {
      type: DataTypes.ENUM,
      defaultValue: 'planning',
      values: ['planning', 'in-progress', 'suspended', 'abandoned', 'finished']
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

        Project.hasMany(models.BlogPost, {onDelete: 'cascade'});

        Project.hasMany(models.Image, {
          // as: 'images',
          foreignKey: 'imageable_id',
          constraints: false,
          scope: {
            imageable: 'Project'
          },
          onDelete: 'cascade',
        });

        Project.addScope('defaultScope',{
          where: {archived: false},
          order: [['updatedAt','DESC']],
        },{override:true})

        Project.addScope('images', {
          include: [{model:models.Image}]
        })

        Project.addScope('blogs', {
          include: [{model:models.BlogPost}]
        })

        Project.addScope('blogsPreview', {
          include: [{
            model: models.BlogPost, 
            required: false,
            where: {archived:false},
            order: [['createdAt','DESC']], 
            limit: 5
          }]
        })
      }
    }
  });


  return Project;
};
