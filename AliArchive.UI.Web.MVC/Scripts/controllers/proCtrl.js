window.app.controller('proCtrl', ['$scope', '$http', 'jsonProFightsFactory', function ($scope, $http, jsonProFightsFactory) {
    
    $scope.copy;

    jsonProFightsFactory.getFights().then(function (response) {
        $scope.fights = response.data;
        $scope.copy = $scope.fights;
    });
        

    $scope.filterValue;

    //TODO filter by year / decade  
    $scope.filter = function () {
        
        $scope.resetClick();

        var searchF;
        var searchS;
        var searchYear;
        var searchReff;
        var searchRefs;
        var searchVenue;
        var searchCity;
        var searchState;
        var searchCountry;

        for (var i = 0, len = $scope.fights.length; i < len; i++) {

            var item = $scope.fights[i];

            search = (item.OpponentFirstName.toLowerCase() + " " + item.OpponentSecondName.toLowerCase()).search($scope.filterValue.toLowerCase());
            searchYear = item.Date.Year.toString().search($scope.filterValue.toLowerCase());
            searchRef = (item.RefereeFirstName.toLowerCase() + " " + item.RefereeSecondName.toLowerCase()).search($scope.filterValue.toLowerCase());
            searchProm = (item.PromoterFirst.toLowerCase() + " " + item.PromoterSecond.toLowerCase()).search($scope.filterValue.toLowerCase());
            searchVenue = item.Venue.toLowerCase().search($scope.filterValue.toLowerCase());
            searchCity = item.City.toLowerCase().search($scope.filterValue.toLowerCase());
            searchState = item.State.toLowerCase().search($scope.filterValue.toLowerCase());
            searchCountry = item.Country.toLowerCase().search($scope.filterValue.toLowerCase());
            
            if ((search === -1 && searchYear === -1 && searchRef === -1 && searchProm === -1 && searchVenue === -1 && searchCity === -1 && searchState === -1 && searchCountry === -1))
            {

                $scope.fights[i].Show = false;
            }
        };

        $scope.fights = $scope.copy;


    };

    //infoClick
    $scope.infoClick = function (index) {
        
    };
    
    $scope.fighterFilterClick = function (fname, sname) {

        $scope.resetClick();
        for (var i = 0, len = $scope.fights.length; i < len; i++) {

            var item = $scope.fights[i];
                        
                var f = item.OpponentFirstName !== fname, s = item.OpponentSecondName !== sname;

                if ((f || s)) {

                    $scope.fights[i].Show = false;
                }
        };

        $scope.fights = $scope.copy;
    };

    $scope.refereeFilterClick = function (name) {

        $scope.resetClick();

        for (var i = 0, len = $scope.fights.length; i < len; i++) {

            var item = $scope.fights[i];

            if (item.RefereeSecondName != name) {
                $scope.fights[i].Show = false;
            }
        };

        $scope.fights = $scope.copy;
    };

    $scope.JudgeFilterClick = function (fname, sname, index) {

        $scope.resetClick();
        var judgeExists;


        for (var i = 0, len = $scope.fights.length; i < len; i++) {

            $scope.fights[i].Show = false;

        }

        for (var i = 0, len = $scope.fights.length; i < len; i++) {

            var item = $scope.fights[i];
                        
            loop:

            for (var j = 0; j < item.JudgeFirst.length; j++) {
                
                var f = item.JudgeFirst[j] === fname, s = item.JudgeSecond[j] === sname;
                
                if(f && s)
                {
                    judgeExists = true;
                }
                
                if (judgeExists) {
                    $scope.fights[i].Show = true;

                    judgeExists = false;
                    break loop;
                }

            }
                                    
        };
        $scope.fights = $scope.copy;
    };

    $scope.VenueFilterClick = function (name, index) {

        $scope.resetClick();

        for (var i = 0, len = $scope.fights.length; i < len; i++) {

            var item = $scope.fights[i];

            if (item.Venue != name) {
                $scope.fights[i].Show = false;
            }
        };
        $scope.fights = $scope.copy;
    };

    $scope.CityFilterClick = function (name, index) {

        $scope.resetClick();

        for (var i = 0, len = $scope.fights.length; i < len; i++) {

            var item = $scope.fights[i];

            if (item.City != name) {
                $scope.fights[i].Show = false;
            }
        };
    };

    $scope.StateFilterClick = function (name, index) {

        $scope.resetClick();

        for (var i = 0, len = $scope.fights.length; i < len; i++) {

            var item = $scope.fights[i];

            if (item.State != name) {
                $scope.fights[i].Show = false;
            }
        };
    };

    $scope.CountryFilterClick = function (name, index) {

        $scope.resetClick();

        for (var i = 0, len = $scope.fights.length; i < len; i++) {

            var item = $scope.fights[i];

            if (item.Country != name) {
                $scope.fights[i].Show = false;
            }
        };
    };

    $scope.promoterFilterClick = function (name) {

        $scope.resetClick();

        for (var i = 0, len = $scope.fights.length; i < len; i++) {

            var item = $scope.fights[i];

            if (item.PromoterSecond != name) {
                $scope.fights[i].Show = false;
            }
        };
    };

    $scope.resetClick = function () {

        for (var i = 0, len = $scope.fights.length; i < len; i++) {

            var item = $scope.fights[i];

            $scope.fights[i].Show = true;

        };
    };

}]);