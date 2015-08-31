var recipeApp = angular.module('recipeApp', ['RecipeModel','ParseService','ionic','mgcrea.pullToRefresh']);


// Auth: http://localhost/views/recipe/auth.html
//***********************************************
//Auth
//***********************************************
recipeApp.controller('AuthCtrl', function ($scope,ParseService) {
  $scope.blank = "";
  // Objects to toggle login vs signup states
  var signupState = {
    isSignup:true,
    submitColor:"button-positive",
    toggleColor:"button-stable",
    submitText:"Create Account",
    toggleText:"Or Login",
    headerText:"Create an Account",
    infoText:"Create an account to post your own recipies and follow others!"
  };
  var loginState = {
    isSignup:false,
    submitColor:"button-stable",
    toggleColor:"button-positive",
    submitText:"Login",
    toggleText:"Or Create",
    headerText:"Login to your Account",
    infoText:"Login to follow others and post your own recipies!"
  };
  $scope.state = signupState;

  //Scope Functions
  $scope.toggleState = function(){
    if($scope.state.isSignup){
      $scope.state = loginState;
      $scope.blank = " "
    }else{
      $scope.state = signupState;
      $scope.blank = "  "
    }
  }

  $scope.submit = function(){
    //SIGN UP
    var check={
        name:false,
        email:false,
        password:false
      }
      if($scope.data){
        if($scope.data.name && $scope.data.name.length>0){
          check.name = true;
        }
        if($scope.data.username && $scope.data.username.length>0){
          check.username =true;
        }
        if($scope.data.password && $scope.data.password.length>0){
          check.password = true;
        }
    }
    if($scope.state.isSignup){
      if(check.name&&check.username&&check.password){
        ParseService.signup($scope.data.name,$scope.data.username,$scope.data.password,function(mesg){
        if(mesg.status != 400){
            console.log('signed up');
            var msg = {};
            msg.username = $scope.data.username;
            msg.password = $scope.data.password;
            msg.type = "login";
            window.postMessage(msg, "*");
            steroids.modal.hide();
        }else{
          $scope.state.infoText = "There was a problem connecting, please try again";
        }
      })
      }else{
        $scope.state.infoText = "Please fill out all fields";
        $scope.state.errorColor = "assertive";
      }
    //LOGIN
    }else{
      if(check.username&&check.password){
        ParseService.login($scope.data.username,$scope.data.password,function(mesg){
        if(mesg.status != 400){
            var msg = {};
            msg.username = $scope.data.username;
            msg.password = $scope.data.password;
            msg.type = "login";
            window.postMessage(msg, "*");
            console.log('logged in');
            steroids.modal.hide();
        }else{
          $scope.state.infoText = "There was a problem connecting, please try again";
        }
      })
      }else{
        $scope.state.infoText = "Please fill out all fields";
        $scope.state.errorColor = "assertive";
      }
    }
  }

  // Native navigation
  steroids.view.navigationBar.show("Recipe App");
  steroids.view.setBackgroundColor("#FFFFFF");

});



// Index: http://localhost/views/recipe/index.html
//***********************************************
//Index
//***********************************************
recipeApp.controller('IndexCtrl', function ($scope,ParseService) {
  if(!ParseService.isCurrentUser()){
    loginView = new steroids.views.WebView("/views/recipe/auth.html");
    steroids.modal.show(loginView);
  }

  // Helper function for opening new webviews
  $scope.details = function(id) {
    webView = new steroids.views.WebView("/views/recipe/show.html?id="+id);
    steroids.layers.push(webView);
  };

  $scope.followTab = function(){
    steroids.tabBar.selectTab(1);
  }

  // Fetch all objects from the local JSON (see app/models/recipe.js)
  
  refresh = function(){
  //Parse service to fetch recipies
    ParseService.getRecipies(function(msg){
      if(msg.status != 400){
        console.log(msg.data);
        $scope.displayInvite = false;
        if(msg.data.length == 0){
          $scope.displayInvite = true;
        }
        $scope.recipes = msg.data;
        $scope.$apply();
      }
    })
  }

  $scope.onReload = function(){
    alert('refreshing');
    $scope.$broadcast('scroll.refreshComplete');
    $scope.$apply();
  }

  $scope.loadMore = function(){
    alert("loading more");
  }

  $scope.favorite = function(recipeid,index){
    $scope.recipes[index].isFavorite = !$scope.recipes[index].isFavorite;
    ParseService.toggleFavorite(recipeid,function(){

    })
  }

  refresh();
  var handlerId = steroids.tabBar.on('didchange', function(event) {
    refresh();
  });

  // Native navigation
  steroids.view.navigationBar.show("Recipe Collection");
  steroids.view.setBackgroundColor("#FFFFFF");

  window.addEventListener("message", function(msg) {
      if(msg.data){
        if(msg.data.type=="login"){
        ParseService.login(msg.data.username,msg.data.password,function(){
          $scope.$apply(function() {

          refresh();
            
            });
           

        });
      }
    }
    });
  window.addEventListener("message", function(msg) {
      if(msg.data){
        if(msg.data.type=="update"){
        refresh();
      }
    }
    });

});


// Show: http://localhost/views/recipe/show.html?id=<id>
//***********************************************
//Show
//***********************************************
recipeApp.controller('ShowCtrl', function ($scope, $filter, ParseService) {

  // Fetch all objects from the local JSON (see app/models/recipe.js)
  
  ParseService.getRecipe( steroids.view.params.id,function(msg){
    if(msg.status != 400){
      console.log(msg.data);
      $scope.recipe = msg.data;
      $scope.$apply();
    }
  })

  $scope.user = ParseService.isCurrentUser();

  $scope.favorite = function(recipeid,index){
    $scope.recipes[index].isFavorite = !$scope.recipes[index].isFavorite;
    ParseService.toggleFavorite(recipeid,function(){

    })
  }
  $scope.remove = function(recipe){
    ParseService.removeRecipe(recipe,function(msg){
      var upd = {
            type : "update"
          };
      window.postMessage(upd, "*");
      steroids.layers.popAll();
    });

  }

  // Native navigation
  steroids.view.navigationBar.show("Recipe");
  steroids.view.setBackgroundColor("#FFFFFF");

});



// Follow: http://localhost/views/recipe/Follow.html?id=<id>
//***********************************************
//Follow
//***********************************************
recipeApp.controller('FollowCtrl', function ($scope, $filter, ParseService) {

  // Fetch all objects from the local JSON (see app/models/recipe.js)
    $scope.input = {
      search:""
    }
    $scope.setSearchFilter = function()
    {
        $scope.searchFilter = {};
        $scope.searchFilter['name'] = $scope.input.search;
    }
    $scope.clearSearch = function(){
      $scope.input.search = "";
      $scope.setSearchFilter();
    }

  refresh = function(){
  //Parse service to fetch recipies
    ParseService.getUsers(function(msg){
      if(msg.status != 400){
        console.log(msg.data);
        $scope.users = msg.data;
        $scope.$apply(function() {

          $scope.users = msg.data;
            
            });
           
      }
    })
  }
 window.addEventListener("message", function(msg) {
      if(msg.data){
        if(msg.data.type=="login"){
        ParseService.login(msg.data.username,msg.data.password,function(){
          $scope.$apply(function() {

          refresh();
            
            });
           

        });
      }
    }
    });

  $scope.follow = function(user,index){
    $scope.users[index].isFollowed = !$scope.users[index].isFollowed;
    ParseService.toggleFollow(user,function(){

    })
  }

  // Native navigation
  steroids.view.navigationBar.show("Follow Other Cooks");

  //*********************************** refresh handlers **************************************

  refresh();
  var handlerId = steroids.tabBar.on('didchange', function(event) {
    refresh();
  });

  

  window.addEventListener("message", function(msg) {
      if(msg.data){
        if(msg.data.type=="update"){
        refresh();
      }
    }
    });

});


// Create: http://localhost/views/recipe/create.html
// Captures an image, next steps are create recipe
//***********************************************
//Create
//***********************************************
recipeApp.controller('CreateCtrl', function ($scope, $filter, RecipeRestangular,ParseService) {

  steroids.view.navigationBar.show("New Recipe");
  steroids.view.setBackgroundColor("#FFFFFF");

  //$scope declarations:
  var imagefile;
  $scope.cameraicon = true;
  //******************** OCR **************************
  $scope.imageText = "Hello Testing...";
  $scope.testOCR = function(){
    function OCRImage(image){
      var canvas = document.createElement('canvas')
      canvas.width  = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(image, 0, 0)
      return OCRAD(canvas)
    }
      
    function OCRPath(url, callback){
      var image = new Image()
      image.src = url;
      image.onload = function(){ callback(OCRImage(image)) }
    }

    function OCRSuccess(imageData){
      steroids.logger.log("-----------hello-----------");
      var imageURL = "data:image/jpeg;base64," + imageData;
        OCRPath(imageURL, function(words){
        console.log(words);
        $scope.imageText = words;
        $scope.$apply();
      });
    }
    navigator.camera.getPicture(
      OCRSuccess, 
      onFail, 
      { quality: 50,
        destinationType: Camera.DestinationType.DATA_URL,
        // targetWidth: 300,
        // targetHeight: 300,
        // allowEdit : true,
        sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM
      });
    
  }

  //******************** Image Capture **************************

  function onSuccess(imageData) {
    $scope.cameraicon = true;
    $scope.$apply();
    var image = document.getElementById('myImage');
    // image.src = imageData;
    image.src = "data:image/jpeg;base64," + imageData;
    ParseService.uploadImage(image,imageData,function(file){
      imagefile = file;
    });
  }

  function onFail(message) {
    $scope.cameraicon = true;
    $scope.$apply();
    console.log('Failed because: ' + message);
  }

  $scope.capture = function(){
    $scope.cameraicon = false;
    $scope.success = true;
    navigator.camera.getPicture(onSuccess, onFail, 
      { quality: 50,
        destinationType: Camera.DestinationType.DATA_URL,
        targetWidth: 300,
        targetHeight: 300,
        allowEdit : true,
        sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM
      });
  }
  $scope.success = false;

  $scope.create = function(){
    $scope.showError = true;
    var check={
        name:false,
        description:false,
        image:false
      }
    if($scope.data){
        if($scope.data.name && $scope.data.name.length>0){
          check.name = true;
        }
        if($scope.data.description && $scope.data.description.length>0){
          check.description =true;
        }
        if(imagefile){
          check.image = true;
        }
    }
    if(check.name && check.description && check.image){
      ParseService.createRecipe($scope.data,imagefile,function(){
      $scope.data.name = "";
      $scope.data.description = "";
      imagefile = null;
      $scope.showError = false;
      var image = document.getElementById('myImage');
      // image.src = imageData;
      image.src = "/images/cameraLight.png";
      $scope.$apply();
      var upd = {
            type : "update"
          };
      window.postMessage(upd, "*");
      steroids.tabBar.selectTab(0);
    })
    }else{
      $scope.showError = true;
      $scope.errorText = "Please complete all fields"
      if(check.name == false && check.description == false && check.image == false){
        $scope.errorText = "Please complete name, image, and description"
      }else if(check.name == false && check.description==false){
        $scope.errorText = "Please provide a name and description"
      }else if(check.name == false && check.image==false){
        $scope.errorText = "Please provide a name and an image"
      }else if(check.description == false&&check.image){
        $scope.errorText = "Please provide an image and a description"
      }else if(check.name == false){
        $scope.errorText = "Please provide a name"
      }else if(check.description == false){
        $scope.errorText = "Please provide a description"
      }else if(check.image == false){
        $scope.errorText = "Please provide an image"
      }
    }
    
  }

  window.addEventListener("message", function(msg) {
      if(msg.data){
        if(msg.data.type=="login"){
        ParseService.login(msg.data.username,msg.data.password,function(){

        });
      }
    }
  });

});

recipeApp.controller('ProfileCtrl', function ($scope,ParseService) {

  steroids.view.navigationBar.show("Profile");

  var textButton = new steroids.buttons.NavigationBarButton();
  textButton.title = "Log Out";
  textButton.onTap = function() {
    ParseService.logout(function(){
      steroids.tabBar.selectTab(0);
      loginView = new steroids.views.WebView("/views/recipe/auth.html");
      steroids.modal.show(loginView);
    })
   }

   steroids.view.navigationBar.update({
    buttons: {
      right: [textButton]
    }
  })

  

  $scope.currenttab = {
    active : true
  }
  
  $scope.toggle = function(toggleto){
    console.log("toggling to: "+toggleto);
    $scope.currenttab.active = toggleto;
  }

  $scope.details = function(id) {
    webView = new steroids.views.WebView("/views/recipe/show.html?id="+id);
    steroids.layers.push(webView);
  };

  $scope.settings = function() {
    webView = new steroids.views.WebView("/views/recipe/settings.html");
    steroids.layers.push(webView);
  };


  function refresh(){
   $scope.user=ParseService.isCurrentUser();
   ParseService.getUserRecipies(function(msg){
    if(msg.status != 400){
      console.log(msg.data);
      $scope.recipes = msg.data;
      $scope.$apply();
    }
   })
   ParseService.getUserFavoriteRecipies(function(msg){
    if(msg.status != 400){
      console.log(msg.data);
      $scope.favorites = msg.data;
      $scope.$apply();
    }
   })
 }

//****************************** profile pic handler ******************************

 function onSuccess(imageData) {

    var image = document.getElementById('myImage');
    // image.src = imageData;
    image.src = "data:image/jpeg;base64," + imageData;
    ParseService.uploadImage(image,imageData,function(file){
      ParseService.addProfilePicture(file,function(user){
        $scope.user = user;
        $scope.$apply();
      })
    });
  }

  function onFail(message) {
    console.log('Failed because: ' + message);
  }

  $scope.uploadPicture = function(){
    $scope.success = true;
    navigator.camera.getPicture(onSuccess, onFail, 
      { quality: 50,
        destinationType: Camera.DestinationType.DATA_URL,
        targetWidth: 100,
        targetHeight: 100,
        allowEdit : true,
        sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM
      });
  }

 //*********************************** refresh handlers **************************************

  refresh();
  var handlerId = steroids.tabBar.on('didchange', function(event) {
    refresh();
  });

  window.addEventListener("message", function(msg) {
      if(msg.data){
        if(msg.data.type=="login"){
        ParseService.login(msg.data.username,msg.data.password,function(){
          $scope.$apply(function() {

          refresh();
            
            });
           

        });
      }
    }
    });
  window.addEventListener("message", function(msg) {
      if(msg.data){
        if(msg.data.type=="update"){
        refresh();
      }
    }
    });

});



// recipeApp.controller('SettingsCtrl', function ($scope,ParseService) {
//   steroids.view.navigationBar.show("Profile");
  
//   var textButton = new steroids.buttons.NavigationBarButton();
//   textButton.title = "Log Out";
//   textButton.onTap = function() {
//     window.postMessage(msg, "*");
//     ParseService.logout(function(){
//       steroids.tabBar.selectTab(0);
//       loginView = new steroids.views.WebView("/views/recipe/auth.html");
//       steroids.modal.show(loginView);
//     })
//    }

//    steroids.view.navigationBar.update({
//     buttons: {
//       right: [textButton]
//     }
//   })
   

// });

