/// <reference path="../_references.js" />
window.app.factory('jsonAmateurFightsFactory', ['$http',function ($http) {
    return {
        getFights: function(){
            return $http.get('/Home/JsonAmateurFights');
        }
    }
}]);