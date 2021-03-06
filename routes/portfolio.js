'use strict';

var express = require('express');
var router = express.Router();

router.get('/', Common.middleware.querify, (req, res, next) => {

  let query = {}
  
  let limit = (req.query.n || 10);
  res.locals.page = Math.max(Number(req.query.page)||1,1)
  let offset = limit * ((res.locals.page-1) || 0)
  Object.assign(res.locals, {limit, offset})

  res.locals.action = req.baseUrl

  if(req.query.category) {
    query.category = req.query.category
    res.locals.category = req.query.category
  }

  return db.Project.scope(null).findAll({
    attributes: [
      [db.sequelize.fn('DISTINCT', db.sequelize.col('category')), 'category'],
      [db.sequelize.fn('COUNT', db.sequelize.col('category')), 'count']
    ],
    group:['category']
  })
  .then(aggregation => {
    res.locals.aggregation = {}
    res.locals.total = 0
    aggregation.map(agg => {
      let count = Number(agg.dataValues.count)
      res.locals.total += count
      res.locals.aggregation[agg.category] = count
    })

    if(res.locals.category) res.locals.total = res.locals.aggregation[res.locals.category]

    res.locals.pages = Math.ceil(res.locals.total / limit)

    return db.Project.scope(['blogsPreview','images']).findAll({
      where: query,
      limit: limit, 
      offset: offset, 
      order: [['updatedAt','DESC']]
    })
    .then(projects => {
      res.locals.projects = projects

      if(req.json) return res.json(projects);
      if(req.isTab) return res.render('portfolio/_index');
      return res.render('portfolio/index');
    })

  })

  .catch(next);
});

router.get('/new', Common.middleware.requireUser, (req,res,next) => {
  return res.set('X-Modal', true).render('portfolio/edit');
});

router.post('/', Common.middleware.requireUser, Common.middleware.objectify, (req,res,next) => {

  return db.Project.create(Object.assign(req.body, {UserId: req.user.id}))
  .then(project => {
    
    return res.set('X-Redirect', '/portfolio/' + project.url).sendStatus(200)
  })
  .catch(next)

});

let projectRouter = express.Router({mergeParams:true});

router.use('/:url', (req,res,next) => {
  db.Project.scope(['images']).find({where:{url:req.params.url}, include:[
    {model:db.BlogPost, limit: 3}
  ]})
  .then(project => {
    if(!project) throw Common.error.notfound('Project');
    res.locals.project = res.locals.imageable = project
    res.locals.title = `${project.title} – ${SITE_NAME}`
    res.set('X-Page-Title', encodeURIComponent(res.locals.title))
    

    if(project.Images && project.Images.length > 0) {
      let randomImage = project.Images[Math.floor(Math.random()*project.Images.length)].path
      res.locals.action = req.baseUrl
      res.locals.headerImage = randomImage
      res.set('X-Header-Image', randomImage)
    }

    return next()
  })
  .catch(next)
}, projectRouter);

projectRouter.get('/', (req,res,next)=> {
  if(req.json) return res.json(res.locals.project)
  if(req.isTab) return res.render('portfolio/_detail')
  return res.render('portfolio/detail')
})

projectRouter.patch('/', Common.middleware.requireUser, Common.middleware.objectify, (req,res,next) => {

  return res.locals.project.update(req.body)
  .then(project => {
    return res.set('X-Redirect', "/portfolio/" + project.url).sendStatus(302)
  })
  .catch(next)
})

projectRouter.delete('/', Common.middleware.confirm({route:'portfolio', disallowBypass:true}), Common.middleware.requireUser, Common.middleware.objectify, (req,res,next) => {

  return res.locals.project.destroy()
  .then(project => {
    return res.set('X-Redirect', "/portfolio").sendStatus(302)
  })
  .catch(next)
})

projectRouter.get('/edit', (req,res,next)=> {
  return res.set('X-Modal', true).render('portfolio/edit');
})

projectRouter.use('/blog', require('./blog.js'));

projectRouter.use('/images', (req,res,next) => {
  res.locals.imageable = res.locals.project
  res.locals.action = req.baseUrl
  return next();
}, require('./images'));

module.exports = router;
