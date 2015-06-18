window.app.controller('amateurCtrl', ['$scope', '$http', 'jsonAmateurFightsFactory', function ($scope, $http, jsonAmateurFightsFactory) {
    
    jsonAmateurFightsFactory.getFights().then(function (response) {
        $scope.amateurFights = response.data;
    });

}]);