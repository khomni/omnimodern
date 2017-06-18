'use strict';

var express = require('express');
var router = express.Router();

router.get('/', Common.middleware.querify, (req, res, next) => {

  let query = {}

  let limit = (req.query.n || 10);
  res.locals.page = Math.max(Number(req.query.page)||1,1)
  let offset = limit * ((res.locals.page-1) || 0)

  res.locals.action = req.baseUrl
  if(res.locals.project) query.ProjectId = res.locals.project.id

  return db.BlogPost.findAndCountAll({where:query, order: [['createdAt','DESC']], limit: limit, offset: offset, include: [{model: db.Project}] })
  .then(blogposts => {
    res.locals.blogposts = blogposts.rows
    res.locals.total = blogposts.count

    res.locals.pages = Math.ceil(blogposts.count / limit)

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
    return res.set('X-Redirect', req.baseUrl + '/' + blogpost.slug).sendStatus(302)
  })
  .catch(next)
})

var blogRouter = express.Router({mergeParams:true});

router.use('/:slug', (req,res,next) => {


  return db.BlogPost.find({where: {slug: req.params.slug}, include: [{model: db.Project}]})
  .then(blogpost => {
    if(!blogpost) return Common.error.notfound('Blog post not found')
    res.locals.post = blogpost
    res.locals.action = req.baseUrl
    return next();
  })
  .catch(next)
}, blogRouter)

blogRouter.get('/', (req,res,next)=>{
  return res.json(res.locals.post)
})

blogRouter.get('/edit', (req,res,next) => {
  return res.set('X-Modal', true).render('blog/edit');
})

blogRouter.patch('/', Common.middleware.requireUser, Common.middleware.objectify, (req,res,next)=>{
  return res.locals.post.update(req.body)
  .then(blogpost => {
    return res.set('X-Redirect', '/blog/' + res.locals.post.slug).sendStatus(302)
  })
  .catch(next)
})

blogRouter.delete('/', Common.middleware.requireUser, Common.middleware.objectify, (req,res,next)=>{
  return res.locals.post.destroy()
  .then(blogpost => {
    return res.set('X-Redirect', '/blog').sendStatus(302)
  })
  .catch(next)
})

blogRouter.use('/images', (req,res,next) => {
  res.locals.imageable = res.locals.post
  return next();
}, require('./images'));



module.exports = router;
