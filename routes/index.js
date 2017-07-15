'use strict';

var express = require('express');
var router = express.Router();
var models = require('../models');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;


router.use('/', (req,res,next) => {
  res.locals.href = req.originalUrl
  return next();
})
/* GET home page. */
router.get('/', (req, res, next) => {

  return db.Image.findAll({where:{public:true}, order:[['createdAt','DESC']]})
  .then(images => {
    if(images.length) {
      let randomImage = images[Math.floor(Math.random()*images.length)].path
      res.locals.headerImage = randomImage
      res.set('X-Header-Image', randomImage);
    }

    res.locals.images = images
    if(!req.isTab) return res.render('index');
    return res.render('home');
  })
  .catch(next)

});

// router.use('/', (req,res,next) => {
//   if(req.isTab || req.json || req.modal) return next();
//   return res.render('index', {href: req.url})
// })

router.route('/admin')
.get(Common.middleware.statictab, (req,res,next) => {
  if(req.user) return next(Common.error.request('Already Logged In'));

  return db.User.count()
  .then(n => {
    if(!n) return res.set('X-Modal', true).render('users/_signup');

    if(req.modal) return res.set('X-Modal', true).render('users/_login');
    return res.render('users/login')
  })
  .catch(next)

})
.post((req,res,next) => {

  passport.authenticate('local', (err,user,info) => {
    if (err) return next(err);
    if (!user) return next(Common.error.request('Invalid Credentials')); 

    req.logIn(user, err => {
      if (err) return next(err);
      return res.set('X-Redirect', req.headers.referer).sendStatus(200);
    })
  })(req, res, next)

})

// signup route is only for kyle. If other users are needed, they'll be added a different way
router.post('/signup', (req,res,next) => {
  return db.User.count()
  .then(n => {
    if(n) throw null; // stealth route

    return db.User.create({
      username: "kyle",
      name: "Kyle",
      admin: true, // first user gets admin priv of course
      password: req.body.password,
    })
    .then(user => {

      req.logIn(user, err => {
        if (err) return next(err);
        return res.set('X-Redirect', '/').sendStatus(200);
      })
      
    })
  })
  .catch(next)
});


router.get('/about', Common.middleware.title('About'), (req, res, next) => {
  if(req.isTab) return res.render('_about');
  return res.render('about');
});

router.use('/u', require('./user'));
router.use('/portfolio', Common.middleware.title('Portfolio'), require('./portfolio'));
router.use('/blog', Common.middleware.title('Blog'), require('./blog'));

router.use('/images', require('./images'))

router.use('/i', require('./images'));

module.exports = router;
