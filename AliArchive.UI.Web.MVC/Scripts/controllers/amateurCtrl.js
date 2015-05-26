window.app.controller('amateurCtrl', function ($scope, $http, jsonAmateurFightsFactory) {
    
    jsonAmateurFightsFactory.getFights().then(function (response) {
        $scope.amateurFights = response.data;
    });

});