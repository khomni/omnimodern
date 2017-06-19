"use strict";

module.exports = function(sequelize, DataTypes) {
  var BlogPost = sequelize.define("BlogPost", {
    slug: { // sluggable url
      type: DataTypes.STRING,
      unique: true,
      index:true,
    },
    title: { // all good blog posts need a title
      type: DataTypes.STRING
    },
    body: { // body of the blog post; supports markup / HTML
      type: DataTypes.TEXT
    },
    body_preview: {
      type: DataTypes.VIRTUAL,
      get: function(){
        if(this.body) {
          let preview = (this.body||"").split(/\n+/).slice(0,3).join('\n\n')
          return preview
        }
      }
    },
    truncated: {
      type: DataTypes.VIRTUAL, 
      get: function(){
        return (this.body||"").split(/\n+/).length > 3
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
          include: [{model:models.Image}]
        })

        BlogPost.addScope('project', {
          include: [{model:models.Project}]
        })

        BlogPost.addScope('user', {
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
