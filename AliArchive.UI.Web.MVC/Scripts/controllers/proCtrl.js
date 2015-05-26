window.app.controller('proCtrl', function ($scope, $http, jsonProFightsFactory) {
    
    jsonProFightsFactory.getFights().then(function (response) {
        $scope.fights = response.data;
    });


    

});