window.app.controller('proCtrl', function ($scope, $http) {

    $http.get('/Home/jsonfights').success(function (data) {

        $scope.fights = data;

    });
    
});