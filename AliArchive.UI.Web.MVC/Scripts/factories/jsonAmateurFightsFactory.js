/// <reference path="../_references.js" />
window.app.factory('jsonAmateurFightsFactory', function ($http) {
    return {
        getFights: function(){
            return $http.get('/Home/JsonAmateurFights');
        }
    }
});