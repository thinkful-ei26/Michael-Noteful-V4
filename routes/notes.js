'use strict';

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const Note = require('../models/note');
const Tag = require('../models/tag');
const Folder = require('../models/folder');
const router = express.Router();
//specify the authentication
router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;
  const userId = req.user.id;
  let filter = { userId };

  // Check for bad ids
  if (!userId) {
    const err = new Error('The userId is invalid.');
    err.status = 400;
    return next(err);
  }
  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.$or = [{ 'title': re }, { 'content': re }];
  }

  if (folderId) {
    filter.folderId = folderId;
  }

  if (tagId) {
    filter.tags = tagId;
  }

  Note.find(filter)
    .populate('tags')
    .sort({ updatedAt: 'desc' })
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  console.log(req.user.id);
  // Checking for bad ids
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  if (!userId) {
    const err = new Error('The userId is invalid.');
    err.status = 400;
    return next(err);
  }

  Note.findOne({_id: id, userId})
    .populate('tags')
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;
  
  
  // Checking for improper input from the user
  // Check for bad ids
  if (!userId) {
    const err = new Error('The userId is invalid.');
    err.status = 400;
    return next(err);
  }
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }

  if (toUpdate.tags) {
    const badIds = toUpdate.tags.filter((tag) => !mongoose.Types.ObjectId.isValid(tag));
    // let temp = req.body.tags;
    console.log(Array.isArray(req.body.tags));

    if(Array.isArray(req.body.tags)){
      toUpdate.tags.forEach( tag => {
        Tag.findById(tag)
        .then(result => {
          
          if(!result.userId == userId){
            const err = new Error('The tags were not valid or owned by the user');
            err.status = 400;
            return next(err);
          }
          
        });
      })
    }
    
    if (badIds.length) {
      const err = new Error('The `tags` array contains an invalid `id`');
      err.status = 400;
      return next(err);
    }
  }

  const newNote = { title, content, folderId, tags, userId };
  if (newNote.folderId === '') {
    delete newNote.folderId;
  }
  if(toUpdate.folderId){
   
    Folder.findById(toUpdate.folderId)
    .then(result => {
      if(!userId == result.userId){
        const err = new Error('The Folder does not belong to this user.');
        err.status = 400;
        return next(err);
      }  
    });
  }

  Note.create(newNote)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const toUpdate = {};
  const updateableFields = ['title', 'content', 'folderId', 'tags'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });
  // Checking for improper input from the user
  // Check for bad ids
  if (!userId) {
    const err = new Error('The userId is invalid.');
    err.status = 400;
    return next(err);
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (toUpdate.title === '') {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (toUpdate.folderId && !mongoose.Types.ObjectId.isValid(toUpdate.folderId)) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }

  if (toUpdate.tags) {
   
    const badIds = toUpdate.tags.filter((tag) => !mongoose.Types.ObjectId.isValid(tag));

    if(Array.isArray(req.body.tags)){
      toUpdate.tags.forEach( tag => {
        Tag.findById(tag)
        .then(result => {
          
          if(!result.userId == userId){
            const err = new Error('The tags were not valid or owned by the user');
            err.status = 400;
            return next(err);
          }
          
        });
      })
    }
    
    if (badIds.length) {
      const err = new Error('The `tags` array contains an invalid `id`');
      err.status = 400;
      return next(err);
    }
  }

  if (toUpdate.folderId === '') {
    delete toUpdate.folderId;
    toUpdate.$unset = {folderId : 1};
  }
  
  if(toUpdate.folderId){
   
    Folder.findById(toUpdate.folderId)
    .then(result => {
      if(!userId == result.userId){
        const err = new Error('The Folder does not belong to this user.');
        err.status = 400;
        return next(err);
      }  
    });
  }

  Note.findOneAndUpdate({_id: id , userId}, toUpdate, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  // Checking for improper input from the user
  // Check for bad ids
  if (!userId) {
    const err = new Error('The userId is invalid.');
    err.status = 400;
    return next(err);
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findOneAndRemove({_id: id,userId})
    .then(() => {
      res.sendStatus(204);
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
