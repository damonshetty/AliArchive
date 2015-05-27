var window = {};

window.app = angular.module('aliApp', ['ngRoute'])
    .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {

        $routeProvider
            .when('/', {
                templateUrl: '/Partials/ProRecord.html',
                controller: 'proCtrl'
            })
            .when('/Home', {
                templateUrl: '/Partials/ProRecord.html',
                controller: 'proCtrl'
            })
            .when('/About', {
                templateUrl: '/Partials/About.html'
            })
            .when('/ProRecord', {
                templateUrl: '/Partials/ProRecord.html',
                controller: 'proCtrl'
            })
            .when('/AmateurRecord', {
                templateUrl: '/Partials/AmateurRecord.html',
                controller: 'amateurCtrl'
            })
            .when('/ExhibitionRecord', {
                templateUrl: '/Partials/ExhibitionRecord.html',
                controller: 'exhibitionCtrl'
            })
            .when('/Commericals', {
                templateUrl: '/Partials/Commercials.html',
                controller: 'commericialsCtrl'
            })

        .otherwise({ redirectTo: '/' });

        $locationProvider.html5Mode(true);

    }])

.directive('taleofThetape', function () {

    return {
        restrict: 'E',
        templateUrl: '/Partials/TaleOfTheTape.html',
    }
})

;