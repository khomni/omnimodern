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

  return db.BlogPost.scope(['project','defaultScope']).findAndCountAll({where:query, limit: limit, offset: offset})
  .then(blogposts => {
    res.locals.blogposts = blogposts.rows
    res.locals.total = blogposts.count

    res.locals.pages = Math.ceil(blogposts.count / limit)

    if(req.json) return res.json(blogposts);
    if(req.isTab) return res.render('blog/_index');
    return res.render('blog/index');
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

  return db.BlogPost.scope(['images','project','user']).find({where: {slug: req.params.slug}})
  .then(blogpost => {
    if(!blogpost) throw Common.error.notfound('Blog Post')
    res.locals.post = blogpost
    res.locals.action = req.baseUrl

    if(blogpost.Images && blogpost.Images.length > 0) {
      let randomImage = blogpost.Images[Math.floor(Math.random()*blogpost.Images.length)].path
      res.locals.action = req.baseUrl
      res.locals.headerImage = randomImage
      res.set('X-Header-Image', randomImage)
    }

    return next();
  })
  .catch(next)
}, blogRouter)

blogRouter.get('/', (req,res,next) => {
  if(req.json) return res.json(res.locals.post)
  if(req.isTab) return res.render('blog/_detail')
  return res.render('blog/detail')
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

blogRouter.delete('/', Common.middleware.confirm({route:'blog'}) ,Common.middleware.requireUser, Common.middleware.objectify, (req,res,next)=>{
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
