'use strict';

const express = require('express');
const router = express.Router();
const request = require('request');
// Images

router.get('/', (req,res,next) => {
  if(!res.locals.imageable) return next();
  res.locals.breadcrumbs.push({name: "Images", url:req.baseUrl});
  return res.json(res.locals.imageable.Images)
});

// uploads an image to the imageable resource
router.post('/', Common.middleware.requireUser, Common.middleware.bufferFile.array('files', CONFIG.aws.PER_RESOURCE_LIMIT), (req,res,next) => {
  // throw an error if there's no resource
  if(!res.locals.imageable) return next(Common.error.notfound('Imageable resource'));
  // throw an error if the operation would give the resource too many images
  if(res.locals.imageable.Images.length + req.files.length > CONFIG.aws.PER_RESOURCE_LIMIT) {
    return next(Common.error.request('You can only upload a maximum of ' + CONFIG.aws.PER_RESOURCE_LIMIT + ' images to this resource'))
  }
  // TODO: image processing library

  res.set('Content-Type','application/octet-stream');

  return Promise.map(req.files, (file,i) => {
    return res.locals.imageable.createImage({
      _directory: res.locals.imageable.$modelOptions.name.plural,
      _file: file
    })
    .then(image => {
      res.write(image.path)
      return image.get({plain:true})
    })
  })
  .then(uploads => {
    res.end()
  })
  .catch(next)
});

// changes the relative order of the user's images
router.post('/order', (req,res,next) => {
  // TODO: this
  return next();
})

let imageRouter = express.Router({mergeParams: true})

router.use('/:id', (req,res,next) => {

  return Promise.try(()=>{
    if(res.locals.imageable) {
      return res.locals.imageable.getImages({ where: {id: req.params.id}})
      .then(images => images[0])
    }

    return db.Image.find({where: {id: req.params.id}})
    .then(image => {
      if(!image) return null;
      return image.getImageable()
      .then(imageable => {
        res.locals.imageable = imageable
        return image
      })
    })
  })
  .then(image => {
    if(!image) throw Common.error.notfound('Image');
    res.locals.image = image
    res.locals.headerImage = image.path
    res.set('X-Header-Image', image.path)
    res.locals.action = '/images/' + image.id
    return next();
  })
  .catch(next)

}, imageRouter);

// get an image in various forms of markup
imageRouter.get('/', (req,res,next) => {
  if(!res.locals.image) return next();
  if(req.isTab) {
    if(res.locals.imageable && res.locals.imageable.path) return res.set('X-Redirect', res.locals.imageable.path).sendStatus(302);
    return res.set('X-Modal', true).render('images/modals/preview')
  } 
  if(req.modal) return res.render('images/modals/preview')
  return res.redirect(res.locals.image.path)
});

// edit image meta-data, visibility, etc
imageRouter.get('/edit', (req,res,next) => {
  if(!res.locals.image) return next();
  if(req.modal) return res.render('images/modals/edit')
  return res.redirect(res.locals.image.path)
});

imageRouter.patch('/', Common.middleware.objectify, (req,res,next) => {
  res.locals.image.update(req.body)
  .then(image => {
    return res.set('X-Redirect', req.headers.referer).sendStatus(302)
    return next();
  })
  .catch(next)
})

imageRouter.delete('/', Common.middleware.requireUser, Common.middleware.confirm({route:'images'}), (req,res,next) => {
  if(!res.locals.image) return next();

  return res.locals.image.destroy()
  .then(() => {
    if(req.isTab || req.modal) {
      if(res.locals.imageable && res.locals.imageable.path) {
        return res.set('X-Redirect', res.locals.imageable.path).sendStatus(302)
      }
      return res.set('X-Redirect', '/').sendStatus(302)
    }
    return res.json({ref:res.locals.image, kind:"Image"})
  })
  .catch(next)

})

module.exports = router
