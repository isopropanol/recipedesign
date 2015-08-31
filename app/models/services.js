// The contents of individual model .js files will be concatenated into dist/models.js
(function() {

// Protects views where AngularJS is not loaded from errors
if ( typeof angular == 'undefined' ) {
	return;
};


angular.module('ParseService',['ngResource']).factory('ParseService', function($resource){
    // Initialize Parse API and objects.
    var PARSE_APP = "z70gVk2KxTJjQfxgoTgLB3MgA7SunCRcpRlK7voz";
    var PARSE_JS = "6rPlk9LomPy3flaiBq3BzlOd9H9X132BCj9BfoXv";

    Parse.initialize(PARSE_APP, PARSE_JS);
    // Cache current logged in user


    /**
     * ParseService Object
     * This is what is used by the controllers to save and retrieve data from Parse.com.
     * Moving all the Parse.com specific stuff into a service allows me to later swap it out 
     * with another back-end service provider without modifying my controller much, if at all.
     */
    var ParseService = {
      name: "Parse",

      isCurrentUser: function isCurrentUser(){
        return Parse.User.current();
      },
      currentUser : function currentUser(callback){

      },

      // Login a user
      login : function login(username, password, callback) {
              username = username.toLowerCase();
              Parse.User.logIn(username, password, {
                success: function(user) {
                  var msg = {};
                  msg.status = 200;
                  msg.user = user;
                  callback(msg);
                },
                error: function(user, error) {
                  var msg = {};
                  msg.status = 400;
                  msg.errormsg = "Error: " + error.message;
                  callback(msg);
                }
        });
      },

      signup : function signup(name,username, password, callback) {
              var user = new Parse.User();
              username = username.toLowerCase();
              user.set('username',username);
              user.set('email',username);
              user.set('password',password);
              user.set('name',name);
              user.signUp().then(function(user){
                  var msg = {};
                  msg.status = 200;
                  msg.user = user;
                  callback(msg);
              },function(error){
                  var msg = {};
                  msg.status = 400;
                  msg.errormsg = "Error: " + error.message;
                  callback(msg);
              });
      },

      // Login a user using Facebook
      FB_login : function FB_login(callback) {
        Parse.FacebookUtils.logIn(null, {
          success: function(user) {
            if (!user.existed()) {
              alert("User signed up and logged in through Facebook!");
            } else {
              alert("User logged in through Facebook!");
            }
            loggedInUser = user;
            callback(user);
          },
          error: function(user, error) {
            alert("User cancelled the Facebook login or did not fully authorize.");
          }
        });
      },

      // Logout current user
      logout : function logout(callback) {
        Parse.User.logOut();
        callback();
      },

      
      getRecipies : function getRecipies(callback) {
        // Create a new Parse Query to search Book records by visibility
        var followquery = new Parse.Query("Follow");
        followquery.equalTo('actor',Parse.User.current());
        var nextquery = new Parse.Query("Recipe");
        var selfquery = new Parse.Query("Recipe");
        
        var favquery = new Parse.Query("Favorite");
        nextquery.matchesKeyInQuery('author','actee',followquery);
        selfquery.equalTo('author',Parse.User.current());
        var recipequery = Parse.Query.or(nextquery,selfquery);
        recipequery.include('author');
        recipequery.descending('createdAt');
        favquery.equalTo('actor',Parse.User.current());
        favquery.descending('createdAt');
        var favorites;
        favquery.find().then(function(favoritesq){
          favorites = favoritesq;
          return recipequery.find();
        }).then(function(recipies){
            for(var i=0;i<recipies.length;i++){
              recipies[i].isFavorite = false;
              favorites.forEach(function(favorite){
                if(recipies[i].id == favorite.get('recipe').id){
                  recipies[i].isFavorite = true;
                }
              });
            }
        	var msg = {};
        	msg.status = 'ok';
        	msg.data = recipies;
        	callback(msg);
        },function(error){
        	var msg = {};
        	msg.status = 400;
        	msg.error = error;
        	callback(msg);
        })
      },
      getRecipe : function getRecipe(recipeid,callback) {
        // Create a new Parse Query to search Book records by visibility
        var nextquery = new Parse.Query("Recipe");
        var favquery = new Parse.Query("Favorite");
        nextquery.include('author');
        nextquery.descending('createdAt');
        nextquery.equalTo("objectId",recipeid);
        favquery.equalTo('actor',Parse.User.current());
        favquery.descending('createdAt');
        var favorites;
        favquery.find().then(function(favoritesq){
          favorites = favoritesq;
          return nextquery.first();
        }).then(function(recipe){
              recipe.isFavorite = false;
              favorites.forEach(function(favorite){
                if(recipe.id == favorite.get('recipe').id){
                  recipe.isFavorite = true;
                }
              });
          var msg = {};
          msg.status = 'ok';
          msg.data = recipe;
          callback(msg);
        },function(error){
          var msg = {};
          msg.status = 400;
          msg.error = error;
          callback(msg);
        })
      },

      removeRecipe : function removeRecipe(recipe,callback){
        recipe.destroy().then(function(recipe){
          var msg = {};
          msg.status = 'ok';
          msg.data = recipe;
          callback(msg);
        },function(error){
          var msg = {};
          msg.status = 400;
          msg.error = error;
          callback(msg);
        })
      },

      toggleFavorite : function toggleFavorite(recipeid,callback){
        var favquery = new Parse.Query("Favorite");
        var recipequery = new Parse.Query("Recipe");
        var recipe;
        recipequery.equalTo('objectId',recipeid);
        favquery.equalTo('actor',Parse.User.current());
        recipequery.first().then(function(recipeq){
          recipe = recipeq;
          favquery.equalTo('recipe',recipe);
          return favquery.first();
        }).then(function(favorite){
          console.log('got a favorite?');
          console.log(favorite);
          var promises = [];
          if(favorite){
            promises.push(favorite.destroy());
          }else{
            var favoriteO = Parse.Object.extend("Favorite");
            var newFavorite = new favoriteO();
            newFavorite.set('actor',Parse.User.current());
            newFavorite.set('recipe',recipe);
            promises.push(newFavorite.save());
          }
          return Parse.Promise.when(promises);
        }).then(function(favorite){
          callback();
        },function(){
          callback();
        })
      },

      getUserRecipies : function getUserRecipies(callback) {
        // Create a new Parse Query to search Book records by visibility
        var nextquery = new Parse.Query("Recipe");
        nextquery.include('author');
        nextquery.equalTo("author",Parse.User.current())
        nextquery.descending('createdAt');
        nextquery.find().then(function(recipies){
          var msg = {};
          msg.status = 'ok';
          msg.data = recipies;
          callback(msg);
        },function(error){
          var msg = {};
          msg.status = 400;
          msg.error = error;
          callback(msg);
        })
      },

      getUserFavoriteRecipies : function getUserFavoriteRecipies(callback) {
        // Create a new Parse Query to search Book records by visibility
        var nextquery = new Parse.Query("Favorite");
        nextquery.include('recipe');
        nextquery.equalTo("actor",Parse.User.current())
        nextquery.descending('createdAt');
        nextquery.find().then(function(favorites){
          var msg = {};
          msg.status = 'ok';
          msg.data = favorites;
          callback(msg);
        },function(error){
          var msg = {};
          msg.status = 400;
          msg.error = error;
          callback(msg);
        })
      },

      getUsers : function getUsers(callback) {
        // Create a new Parse Query to search Book records by visibility
        var nextquery = new Parse.Query("User");
        var follows;
        var followquery = new Parse.Query("Follow");
        followquery.equalTo('actor',Parse.User.current())
        followquery.include('actee');
        nextquery.notEqualTo("objectId",Parse.User.current().id)
        nextquery.ascending('name');
        followquery.find().then(function(followsq){
          follows = followsq;
          return nextquery.find();
        }).then(function(users){
          for(var i=0;i<users.length;i++){
              users[i].isFollowed = false;
              follows.forEach(function(follow){
                if(users[i].id == follow.get('actee').id){
                  users[i].isFollowed = true;
                }
              });
            }
            console.log(users)

          var msg = {};
          msg.status = 'ok';
          msg.data = users;
          callback(msg);
        },function(error){
          var msg = {};
          msg.status = 400;
          msg.error = error;
          callback(msg);
        })
      },

      toggleFollow : function toggleFollow(user,callback){
        var followquery = new Parse.Query("Follow");
        followquery.equalTo('actor',Parse.User.current());
        followquery.equalTo('actee',user);
        followquery.first().then(function(followq){
          var promises = [];
          if(followq){
            promises.push(followq.destroy());
          }else{
            var followOb = Parse.Object.extend("Follow");
            var newfollow = new followOb();
            newfollow.set('actor',Parse.User.current());
            newfollow.set('actee',user);
            promises.push(newfollow.save());
          }
          return Parse.Promise.when(promises);
        }).then(function(){
          var msg = {};
          msg.status = 'ok';
          msg.data = "";
          callback(msg);
        },function(error){
          var msg = {};
          msg.status = 400;
          msg.error = error;
          callback(msg);
        })
      },

      uploadImage : function uploadImage(image,baseS,callback){
        var imageFile = new Parse.File("test.jpg",{base64:baseS});
        imageFile.save().then(function(file){
          callback(file);
        },function(error){

        })

      },

      addProfilePicture : function addProfilePicture(file,callback){
        var user = Parse.User.current();
        user.set('photo',file);
        user.save().then(function(file){
          callback(file);
        },function(error){

        })

      },

      createRecipe : function createRecipe(recipedata,image,callback) {
       
        var recipeObject = Parse.Object.extend("Recipe");
        var recipe = new recipeObject();

        recipe.save({
          author:Parse.User.current(),
          name:recipedata.name,
          description:recipedata.description,
          photo:image
        }).then(function(recipe){
          callback();
        },function(error){

        })
      }
  }

    // The factory function returns ParseService, which is injected into controllers.
    return ParseService;
});


})();
