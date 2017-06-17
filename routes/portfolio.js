'use strict';

var express = require('express');
var router = express.Router();

router.get('/', (req, res, next) => {

  return db.Project.findAll({order: [['updatedAt','DESC']] })
  .then(projects => {
    res.locals.projects = projects

    if(req.json) return res.json(projects);
    if(req.isTab) return res.render('portfolio/index');

    return res.redirect('/');
  })
  .catch(next);
});

router.get('/new', (req,res,next) => {

});

router.post('/', (req,res,next) => {

});

let projectRouter = express.Router({mergeParams:true});

router.use('/:url', (req,res,next) => {
  
})

module.exports = router;
