'use strict'

var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

/* GET users listing. */
router.get('/', (req, res, next) => {
  var users = db.User.findAll({})
  .then( users => {
    res.render('users/', {users:users})
  })
  .catch(err => next(err));
});

var userRouter = express.Router({mergeParams: true});

router.use('/:username',(req,res,next) => {
  return db.User.scope('images').findOne({where: {username:req.params.username}})
  .then(user => {
    if(!user) throw Common.error.notfound('User');
    res.locals.user = user
    res.locals.breadcrumbs.push({name:user.username,url:req.baseUrl})
    res.locals.action = user.url;
    return next();
  }).catch(next);
},userRouter);

userRouter.get('/', (req,res,next) => {

  if(req.json) return res.json(res.locals.user)
  return res.locals.user.getBlogPosts({scope:'preview'}).then(posts => {
    res.locals.user.BlogPosts = posts
    console.log(res.locals.user);
    if(req.isTab) return res.render('users/_profile')
    return res.render('users/profile')
  })
  .catch(next)
});

userRouter.patch('/', Common.middleware.objectify, (req,res,next) => {
  return res.locals.user.update(req.body)
  .then(user => {
    return res.set('X-Redirect', user.url).sendStatus(302)
  })
  .catch(next)
})

userRouter.get('/edit', (req,res,next) => {
  if(req.modal) return res.render('users/edit');
  return next();
});

userRouter.use('/images', (req,res,next) => {
  res.locals.imageable = res.locals.user;
  return next();
}, require('../images'));

module.exports = router;
