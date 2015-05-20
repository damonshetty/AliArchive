//Controller manages the app's data
fightApp.controller('FightCtrl', function ($scope, $http) {
    $http.get('@System.Configuration.ConfigurationManager.AppSettings["jsonfights"]').success(function (data) {
        $scope.fights = data;


        document.write('Test write');
    });
});