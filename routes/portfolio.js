'use strict';

var express = require('express');
var router = express.Router();

router.get('/', (req, res, next) => {

  return db.Project.findAll({order: [['updatedAt','DESC']] , include:[{model:db.BlogPost, order:[['createdAt','DESC']], limit:2}]})
  .then(projects => {
    res.locals.projects = projects

    if(req.json) return res.json(projects);
    if(req.isTab) return res.render('portfolio/index');

    return res.redirect('/');
  })
  .catch(next);
});

router.get('/new', Common.middleware.requireUser, (req,res,next) => {
  
  return res.set('X-Modal', true).render('portfolio/edit');
});

router.post('/', Common.middleware.requireUser, Common.middleware.objectify, (req,res,next) => {

  return db.Project.create(Object.assign(req.body, {UserId: req.user.id}))
  .then(project => {
    
    return res.set('X-Redirect', '/').sendStatus(200)
  })
  .catch(next)

});

let projectRouter = express.Router({mergeParams:true});

router.use('/:url', (req,res,next) => {
  db.Project.find({where:{url:req.params.url}, include:[{model:db.BlogPost}]})
  .then(project => {
    res.locals.project = project
    db._methods(res.locals.project)
    return next()
  })
  .catch(next)
}, projectRouter);

projectRouter.get('/', (req,res,next)=> {
  return res.json(res.locals.project)
})

projectRouter.patch('/', Common.middleware.requireUser, Common.middleware.objectify, (req,res,next) => {

  return res.locals.project.update(req.body)
  .then(project => {
    return res.set('X-Redirect', req.headers.referer).sendStatus(302)
  })
  .catch(next)
})

projectRouter.delete('/', Common.middleware.requireUser, Common.middleware.objectify, (req,res,next) => {

  return res.locals.project.destroy()
  .then(project => {
    return res.set('X-Redirect', req.headers.referer).sendStatus(302)
  })
  .catch(next)
})

projectRouter.get('/edit', (req,res,next)=> {
  return res.set('X-Modal', true).render('portfolio/edit');
})

projectRouter.use('/blog', require('./blog.js'));
projectRouter.use('/blog', require('./blog.js'));

projectRouter.use('/images', (req,res,next) => {
  res.locals.imageable = res.locals.project
  return next();
}, require('./images'));

module.exports = router;
