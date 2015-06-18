/// <reference path="../_references.js" />
window.app.factory('jsonProFightsFactory', ['$http',function ($http) {
    return {
        getFights: function(){
            return $http.get('/Home/jsonfights');
        }
    }
}]);