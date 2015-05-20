fightApp.controller('AmateurFightCtrl', function ($scope, $http) {
    $http.get('@System.Configuration.ConfigurationManager.AppSettings["jsonamateurfights"]').success(function (data) {
        $scope.fights = data;
    });
});