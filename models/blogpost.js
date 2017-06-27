"use strict";

const marked = require('marked');
const cheerio = require('cheerio');

module.exports = function(sequelize, DataTypes) {
  var BlogPost = sequelize.define("BlogPost", {
    path: {
      type:DataTypes.VIRTUAL,
      get: function(){
        return '/blog/' + this.slug
      }
    },
    slug: { // sluggable url
      type: DataTypes.STRING,
      unique: true,
      index:true,
    },
    title: { // all good blog posts need a title
      type: DataTypes.STRING
    },
    body: { // body of the blog post; supports markup / HTML
      type: DataTypes.TEXT,
    },
    $body: { // markup version of the body; automatically adds images in the footnotes
      type: DataTypes.VIRTUAL,
      get: function() {
        if(!this.body) return null;
        let processedBody = this.body
        if(this.Images) {
          processedBody += '\r' + this.Images.map((image, i) => `[${i}]: ${image.path}`).join('\n')
        }
        return marked(processedBody)
      }
    },
    $body_preview: {
      type: DataTypes.VIRTUAL,
      get: function(){
        if(!this.$body) return null;
        let $ = cheerio.load(this.$body);
        let preview = $.html($('body').find('p,h3,h4,h5').slice(0,3))
        return preview
      }
    },
    archived: { // blog post has been archived
      type:DataTypes.BOOLEAN,
      defaultValue: false,
    }
  }, {
    defaultScope: {
      order: [['createdAt','DESC']]
    },
    classMethods: {
      associate: function(models) {
        BlogPost.belongsTo(models.User);
        BlogPost.hasMany(models.Comment);
        BlogPost.belongsTo(models.Project, {onDelete:'cascade', constraints:false});

        BlogPost.hasMany(models.Image, {
          foreignKey: 'imageable_id',
          constraints: false,
          scope: {
            imageable: 'BlogPost'
          },
          onDelete: 'cascade',
        });

        BlogPost.addScope('defaultScope', {
          order: [['createdAt','DESC']],
          include: [{model:models.User}, {model:models.Image, limit:1}]
        }, {override: true})

        BlogPost.addScope('images', {
          order: [['createdAt','DESC']],
          include: [{model:models.Image}]
        })

        BlogPost.addScope('project', {
          order: [['createdAt','DESC']],
          include: [{model:models.Project, required:false}]
        })

        BlogPost.addScope('user', {
          order: [['createdAt','DESC']],
          include: [{model:models.User}]
        })

      }
    }
  });

  function generateSlug(post, options) {
    if(post.slug && !post.changed('title')) return post;

    let originalUrl = post.getDataValue('slug');
    let isUnique = false;
    let iteration = 0;
    let nameComponents = 1;
    let slug = post.getDataValue('title').toLowerCase().trim().split(/\s/).slice(0,10).join('-')
    let slugIteration = slug;


    return Promise.while(()=>!isUnique,()=>{
      post.slug = slugIteration;

      return BlogPost.count({where: {slug: {$eq: slugIteration, $not: originalUrl}}})
      .then(n => {
        if(!n) return isUnique = true;

        return slugIteration = slug + '-' + (++iteration)
      })
    })
    .then( ()=> {
      return post;
    });
  }

  BlogPost.hook('beforeCreate', generateSlug)
  BlogPost.hook('beforeUpdate', generateSlug)
  BlogPost.hook('beforeSave', generateSlug)

  return BlogPost;
};
