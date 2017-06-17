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
      type: DataTypes.TEXT,
      allowNull: false
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
        BlogPost.belongsTo(models.Project, {constraints:false});

        // BlogPost.addScope('defaultScope',{
        //   include: [{mdoel:models.Project}]
        // }, {override: true})

      }
    }
  });

  BlogPost.hook('beforeUpdate', function(post, options){
    if(!post.changed('title')) return post;

    let originalUrl = post.getDataValue('slug');
    let isUnique = false;
    let iteration = 0;
    let nameComponents = 1;
    let slug = post.getDataValue('title').toLowerCase().trim().replace(/\s/g,'-')
    let slugIteration = slug;

    return Promise.while(()=>!isUnique,()=>{
      post.slug = slugIteration;

      return post.count({where: {url: {$eq: url, $not: originalUrl}}})
      .then(n => {
        if(!n) return isUnique = true;

        return slugIteration = slug + '-' + (++iteration)
      })
    })
    .then( ()=> {
      return post;
    });
  })

  return BlogPost;
};
