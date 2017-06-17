'use strict';

var express = require('express');
var router = express.Router();

router.get('/', Common.middleware.querify, (req, res, next) => {

  let limit = (req.query.n || 10);
  let offset = limit * (req.query.page || 0)

  res.locals.action = req.baseUrl

  return Promise.try(()=>{
    if(res.locals.project) return res.locals.project.getBlogPosts({order: [['createdAt','DESC']], limit: limit, offset: offset })
    return db.BlogPost.findAll({order: [['createdAt','DESC']], limit: limit, offset: offset, include: [{model: db.Project}] })
  })
  .then(blogposts => {
    res.locals.blogposts = blogposts
    if(req.json) return res.json(blogposts);
    if(req.isTab) return res.render('blog/index');
  })
  .catch(next);
});

router.get('/new', (req,res,next) => {
  res.locals.action = req.baseUrl;
  return res.set('X-Modal', true).render('blog/edit');
})


router.post('/', Common.middleware.requireUser, Common.middleware.objectify, (req, res, next) => {

  return Promise.try(()=>{
    if(res.locals.project) return res.locals.project.createBlogPost(Object.assign(req.body, {UserId: req.user.id}))
    return db.BlogPost.create(Object.assign(req.body, {UserId: req.user.id}))
  })
  .then(blogpost => {
    return res.set('X-Redirect', '/').sendStatus(302)
  })
  .catch(next)
})

var blogRouter = express.Router({mergeParams:true});

router.use('/:slug', (req,res,next) => {


  return db.BlogPost.find({where: {slug: req.params.slug}, include: [{model: db.Project}]})
  .then(blogpost => {
    if(!blogpost) return Common.error.notfound('Blog post not found')
    res.locals.blogpost = blogpost
    res.locals.action = req.baseUrl
    return next();
  })
  .catch(next)
}, blogRouter)

blogRouter.get('/', (req,res,next)=>{
  return res.json(res.locals.blogpost)
})

blogRouter.get('/edit', (req,res,next) => {
  return res.set('X-Modal', true).render('blog/edit');
})

blogRouter.patch('/', Common.middleware.requireUser, Common.middleware.objectify, (req,res,next)=>{
  return res.locals.blogpost.update(req.body)
  .then(blogpost => {
    return res.set('X-Redirect', '/').sendStatus(302)
  })
  .catch(next)
})

blogRouter.delete('/', Common.middleware.requireUser, Common.middleware.objectify, (req,res,next)=>{
  return res.locals.blogpost.destroy()
  .then(blogpost => {
    return res.set('X-Redirect', '/').sendStatus(302)
  })
  .catch(next)
})

blogRouter.use('/images', (req,res,next) => {
  res.locals.imageable = res.locals.blogpost
  return next();
}, require('./images'));



module.exports = router;
