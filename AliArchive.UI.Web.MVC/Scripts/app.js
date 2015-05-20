//Modules created in here
//Module contains the different components of an AngularJS app
var fightApp = angular.module('fightApp', ['ngRoute'])
    .config(function ($routeProvider, $locationProvider){
        $routeProvider.when('/', { templateURL:'/Templates/Home.html', controller: 'homeViewController' });
        



    }
    

;