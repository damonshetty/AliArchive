window.app.controller('proCtrl', function ($scope, $http, jsonProFightsFactory) {
    
    jsonProFightsFactory.getFights().then(function (response) {
        $scope.fights = response.data;

        $scope.copy = $scope.fights;
    });
        


    //TODO filter by year / decade  

    //infoClick

    $scope.infoClick = function (index) {



    };


    
    $scope.fighterFilterClick = function (name) {

        for (var i = 0, len = $scope.fights.length; i < len; i++) {

            var item = $scope.fights[i];

            if (item.OpponentSecondName != name) {
                $scope.fights[i].Show = null;
            }
        };
    };

    $scope.refereeFilterClick = function (name) {

        for (var i = 0, len = $scope.fights.length; i < len; i++) {

            var item = $scope.fights[i];

            if (item.RefereeSecondName != name) {
                $scope.fights[i].Show = null;
            }
        };
    };

    $scope.JudgeFilterClick = function (name, index) {

        for (var i = 0, len = $scope.fights.length; i < len; i++) {

            var item = $scope.fights[i];

            if (item.JudgeSecond[index] != name) {
                $scope.fights[i].Show = null;
            }
        };
    };

    $scope.VenueFilterClick = function (name, index) {

        for (var i = 0, len = $scope.fights.length; i < len; i++) {

            var item = $scope.fights[i];

            if (item.Venue != name) {
                $scope.fights[i].Show = null;
            }
        };
    };

    $scope.CityFilterClick = function (name, index) {

        for (var i = 0, len = $scope.fights.length; i < len; i++) {

            var item = $scope.fights[i];

            if (item.City != name) {
                $scope.fights[i].Show = null;
            }
        };
    };

    $scope.StateFilterClick = function (name, index) {

        for (var i = 0, len = $scope.fights.length; i < len; i++) {

            var item = $scope.fights[i];

            if (item.State != name) {
                $scope.fights[i].Show = null;
            }
        };
    };

    $scope.CountryFilterClick = function (name, index) {

        for (var i = 0, len = $scope.fights.length; i < len; i++) {

            var item = $scope.fights[i];

            if (item.Country != name) {
                $scope.fights[i].Show = null;
            }
        };
    };

    $scope.resetClick = function () {

        for (var i = 0, len = $scope.fights.length; i < len; i++) {

            var item = $scope.fights[i];

            $scope.fights[i].Show = true;

        };
    };

});