var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Verify = require('./verify');
var Dishes = require('../models/dishes');
var Favorites = require('../models/favorites');

var favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
    .all(Verify.verifyOrdinaryUser)

    .get(function(req, res, next) {
        Favorites.find({ postedBy: req.decoded._id })
            .populate('dishes')
            .populate('postedBy')
            .exec(function(err, favorite) {
                if (err) throw err;
                res.json(favorite);
            });
    })

    .post(function(req, res, next) {
        Dishes.findById(req.body._id, function(err, dish) {
            if (err) throw err;
            Favorites.findOne({ postedBy: req.decoded._id })
                .exec(function(err, favorite){
                    if (err) throw err;
                    console.log("Finding favorite: " + favorite + ", user_id: " + req.decoded._id)
                    if (favorite) {
                        console.log("Existing favorite: " + favorite + ", body_id: " + req.body._id)
                        favorite.dishes.push(req.body._id);
                        favorite.save(function(err, favorite) {
                            if (err) throw err;
                            console.log('Updated Favorites!');
                            res.json(favorite);
                        });
                    } else {
                        Favorites.create({ postedBy: req.decoded._id }, function(err, favorite) {
                            if (err) throw err;
                            console.log("New favorite: " + favorite + ", body_id: " + req.body._id)
                            favorite.dishes.push(req.body._id);
                            favorite.save(function(err, favorite) {
                                if (err) throw err;
                                console.log('Updated Favorites!');
                                res.json(favorite);
                            });
                        });
                    }
                });
        });
    })

    .delete(function(req, res, next) {
        Favorites.remove({ postedBy: req.decoded._id }, function(err, resp) {
            if (err) throw err;
            res.json(resp);
        });
    });

favoriteRouter.route('/:dishId')
    .all(Verify.verifyOrdinaryUser)

    .delete(function(req, res, next) {
        Favorites.findOne({ postedBy: req.decoded._id }, function(err, favorite) {
            if (err) throw err;
            var index = favorite.dishes.indexOf(req.params.dishId);
            if (index > -1) {
                favorite.dishes.splice(index, 1);
                favorite.save(function(err, favorite) {
                    if (err) throw err;
                    console.log('Deleted from Favorites!');
                    res.end('Dish ' + req.params.dishId + ' is removed from favorites');
                });
            } else {
                res.end('Dish ' + req.params.dishId + ' is not a favorite');
            }
        });
    });

module.exports = favoriteRouter;
