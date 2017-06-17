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
          if(preview != this.body) preview += "\n\n ..."
          return preview
        }
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

        BlogPost.addScope('defaultScope',{
          include: [{model:models.User}]
        }, {override: true})

      }
    }
  });

  function generateSlug(post, options) {
    console.log('generate slug', post.changed('title'))
    if(post.slug && !post.changed('title')) return post;

    let originalUrl = post.getDataValue('slug');
    let isUnique = false;
    let iteration = 0;
    let nameComponents = 1;
    let slug = post.getDataValue('title').toLowerCase().trim().split(/\s/).slice(0,10).join('-')
    let slugIteration = slug;


    return Promise.while(()=>!isUnique,()=>{
      post.slug = slugIteration;
      console.log(post.slug)

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
