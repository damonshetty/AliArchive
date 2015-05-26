/// <reference path="../_references.js" />
window.app.factory('jsonProFightsFactory', function ($http) {
    return {
        getFights: function(){
            return $http.get('/Home/jsonfights');
        }
    }
});