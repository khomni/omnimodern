'use strict';

var express = require('express');
var router = express.Router();

router.get('/', Common.middleware.querify, (req, res, next) => {

  let limit = (req.query.n || 10);
  let offset = limit * (req.query.page || 0)

  return Promise.try(()=>{
    if(res.locals.project) return res.locals.project.getBlogPosts({order: [['createdAt','DESC']], limit: limit, offset: offset })
    return db.BlogPost.findAll({order: [['createdAt','DESC']], limit: limit, offset: offset })
  })
  .then(blogposts => {
    res.locals.blogposts = blogposts
    if(req.json) return res.json(blogposts);
    if(req.isTab) return res.render('blog/index');
  })
  .catch(next);
});


router.post('/', (req, res, next) => {
  return res.sendStatus(404)
})

var blogRouter = express.Router({mergeParams:true});

router.use('/:slug', (req,res,next) => {

  return db.BlogPost.find({where: {slug: req.params.slug}})
  .then(blogpost => {
    return res.json(blogpost)
  })
  .catch(next)

})


module.exports = router;
