window.app.controller('amateurCtrl', function ($scope, $http) {

    $http.get('/Home/JsonAmateurFights').success(function (amateurdata) {

        $scope.amateurFights = amateurdata;

    });
    
});