'use strict';

var app = angular.module("application", ["ngRoute","ngMessages"]);
app.config(function ($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "home.html",
            controller: "homeCtrl"
        })
        .when("/login", {
            templateUrl: "login.html",
            controller: "loginCtrl"
        })
        .when("/addUser", {
            templateUrl: "addUser.html",
            controller: "addUserCtrl"
        })
        .when("/createKajmak", {
            templateUrl: "createKajmak.html",
            controller: "createKajmakCtrl"
        })
        .when("/listKajmak", {
            templateUrl: "listKajmak.html",
            controller: "listKajmakCtrl"
        })
        .when("/mixKajmak", {
            templateUrl: "mixKajmak.html",
            controller: "mixKajmakCtrl"
        })
        .when("/details", {
            templateUrl: "details.html",
            controller: "detailsCtrl"
        })
        .when("/kajmakNotification", {
            templateUrl: "kajmakNotification.html",
            controller: "kajmakNotificationCtrl"
        });
});

app.controller("homeCtrl", function ($scope, $interval, appFactory) {
    $scope.start = function () {
        
        $interval(callAtInterval, 60000);

        function callAtInterval() {
            console.log("Interval occurred");
            var array = [];
            appFactory.queryAllKajmak(function (data) {
                for (var i = 0; i < data.length; i++) {
                    parseInt(data[i].Key);
                    data[i].Record.Key = parseInt(data[i].Key);
                    array.push(data[i].Record);
                }
                array.sort(function (a, b) {
                    return parseFloat(a.Key) - parseFloat(b.Key);
                });
                var current = new Date();
                var y = current.getFullYear().toString();
                var m = (current.getMonth() + 1).toString();
                var d = current.getDate().toString();
                var h = current.getHours().toString();
                var mi = current.getMinutes().toString();
                var ampm1 = h >= 12 ? 'pm' : 'am';
                h = h % 12;
                h = h ? h : 12;
                m = m < 10 ? '0' + m : m;

                let finalCurrentDate = d + "." + m + "." + y + "." + " " + h + ":" + mi + " " + ampm1;
                let parts1 = finalCurrentDate.split(/[\s.:]/);
                let mydate1 = new Date(parts1[2], parts1[1] - 1, parts1[0], parts1[4], parts1[5]);

                console.log(finalCurrentDate);
                for(var i = 0; i < array.length; i++) {
                    console.log(i);
                    var parts3 = array[i].expiration_date.split(/[\s.:]/);
                    var mydate4 = new Date(parts3[2], parts3[1] - 1, parts3[0], parts3[4], parts3[5]);
                    console.log(mydate4);
                    if(mydate1 >= mydate4) {
                        appFactory.deleteKajmak(array[i], function (data) {
                        console.log("Kajmak obrisan");
                        });
                    }
                }  
            });
        }

    }
});

app.controller("loginCtrl", function ($scope, $location, appFactory) {
    $scope.loginUser = function () {
        appFactory.loginUser($scope.user, function (data) {
            console.log(data.message);
            if (data.message == "adminok") {
                $location.path("addUser");
            } else if (data.message == "userok") {
                $location.path("createKajmak");
            } else {
                $scope.poruka = data.message;
            }
        });
    }
});

app.controller("addUserCtrl", function ($scope, $location, appFactory) {
    $scope.addUser = function () {
        console.log($scope.user);
        appFactory.addUser($scope.user, function (data) {
            console.log(data);
            console.log(data.message);
            $scope.poruka = data.message;
        });
    }
    $scope.logOut = function () {
        console.log("kliknuto na Log Out");
        appFactory.logOut(function (data) {
            console.log(data);
            if (data.message == "ok") {
                $location.path("login");
            }
        });
    }
});

app.controller("createKajmakCtrl", function ($scope, $location, appFactory) {
    $scope.recordKajmak = function () {
        var trenutniDatum = new Date();
        var year = trenutniDatum.getFullYear().toString();
        var month = (trenutniDatum.getMonth() + 1).toString();
        var day = trenutniDatum.getDate().toString();
        var hour = trenutniDatum.getHours().toString();
        var min = trenutniDatum.getMinutes().toString();
        var ampm = hour >= 12 ? 'pm' : 'am';
        hour = hour % 12;
        hour = hour ? hour : 12;
        min = min < 10 ? '0' + min : min;


        $scope.kajmak.productionDate = day + "." + month + "." + year + "." + " " + hour + ":" + min + " " + ampm;
        console.log($scope.kajmak);
        if ($scope.kajmak.unit == "min") {
            var m = parseInt($scope.kajmak.number);
            var newMin = new Date();
            newMin.setMinutes(newMin.getMinutes() + m);

            min = newMin.getMinutes().toString();
            hour = newMin.getHours().toString();
            day = newMin.getDate().toString();

            ampm = hour >= 12 ? 'pm' : 'am';
            hour = hour % 12;
            hour = hour ? hour : 12;
            min = min < 10 ? '0' + min : min;
        }
        else if ($scope.kajmak.unit == "hour") {
            var h = parseInt($scope.kajmak.number);
            var newHour = new Date();
            newHour.setHours(newHour.getHours() + h);

            hour = newHour.getHours().toString();
            day = newHour.getDate().toString();
            ampm = hour >= 12 ? 'pm' : 'am';
            hour = hour % 12;
            hour = hour ? hour : 12;
            min = min < 10 ? '0' + min : min;
        }
        else if ($scope.kajmak.unit == "days") {
            var d = parseInt($scope.kajmak.number);
            var newDays = new Date();
            newDays.setDate(newDays.getDate() + d);
            day = newDays.getDate().toString();
            var mth1 = newDays.getMonth() + 1;
            month = mth1.toString();

            year = newDays.getFullYear().toString();
        }

        else {
            var mth = parseInt($scope.kajmak.number);
            var newMonth = new Date();
            newMonth.setMonth(newMonth.getMonth() + mth);
            var monthInt = newMonth.getMonth() + 1;
            month = monthInt.toString();
            year = newMonth.getFullYear().toString();
        }

        $scope.kajmak.expirationDate = day + "." + month + "." + year + "." + " " + hour + ":" + min + " " + ampm;
        appFactory.recordKajmak($scope.kajmak, function (data) {
            //$scope.create_kajmak = data;
            console.log("Podaci iz create kajmaka:" + data);
            $scope.poruka = data.message;
        });
    }

    $scope.logOut = function () {
        console.log("kliknuto na Log Out");
        appFactory.logOut(function (data) {
            console.log(data);
            if (data.message == "ok") {
                $location.path("login");
            }
        });
    }
});

app.controller("listKajmakCtrl", ["$scope", "$interval", "$location", "appFactory", "myService", function ($scope, $interval, $location, appFactory, myService) {
    console.log("Uslo u kontroler");
    var array = [];
    appFactory.queryAllKajmak(function (data) {
        for (var i = 0; i < data.length; i++) {
            parseInt(data[i].Key);
            data[i].Record.Key = parseInt(data[i].Key);
            array.push(data[i].Record);
        }
        array.sort(function (a, b) {
            return parseFloat(a.Key) - parseFloat(b.Key);
        });
        $scope.all_kajmak = array;
        console.log(array);
    });

    /*
    $scope.queryAllKajmak = function () {
        var array = [];
        appFactory.queryAllKajmak(function (data) {
            for (var i = 0; i < data.length; i++) {
                parseInt(data[i].Key);
                data[i].Record.Key = parseInt(data[i].Key);
                array.push(data[i].Record);
            }
            array.sort(function (a, b) {
                return parseFloat(a.Key) - parseFloat(b.Key);
            });
            $scope.all_kajmak = array;
            console.log(array);
        });
    }
    */

    $scope.getDetails = function (index) {
        var kajmakDetails = $scope.all_kajmak[index];
        myService.setJson(kajmakDetails);
    }
    $scope.deleteKajmak = function (index) {
        var kajmak = $scope.all_kajmak[index];
        console.log(kajmak);
        appFactory.deleteKajmak(kajmak, function (data) {
            console.log("Kajmak obrisan");
        });
    }
    $scope.logOut = function () {
        console.log("kliknuto na Log Out");
        appFactory.logOut(function (data) {
            console.log(data);
            if (data.message == "ok") {
                $location.path("login");
            }
        });
    }
}]);


app.controller("detailsCtrl", ["$scope", "appFactory", "myService", function ($scope, appFactory, myService) {
    $scope.myreturnedData = myService.getJson();
    appFactory.queryAllUsers(function (data) {
        var array = data;
        $scope.all_users = array;
    });
    $scope.changeOwner = function () {
        $scope.owner.id = $scope.myreturnedData.Key;
        $scope.owner.oldOwner = $scope.myreturnedData.owner;
        console.log("Ono sto majri treba!");
        $scope.owner.name = $scope.owner.name.replace(/\s+/g,"");
        console.log($scope.owner);
        appFactory.changeOwner($scope.owner, function (data) {
            $scope.poruka = data.message;
        });
    }
}]);

app.controller("mixKajmakCtrl", ["$scope", "$location", "appFactory", "myService", function ($scope, $location, appFactory, myService) {
    console.log("Nalazim se u mixKajmakCtrl");
    appFactory.queryAllKajmak(function (data) {
        var array = [];
        for (var i = 0; i < data.length; i++) {
            parseInt(data[i].Key);
            data[i].Record.Key = parseInt(data[i].Key);
            array.push(data[i].Record);
        }
        array.sort(function (a, b) {
            return parseFloat(a.Key) - parseFloat(b.Key);
        });
        $scope.all_kajmak = array;
    });

    /*
    $scope.queryAllKajmak = function () {
        appFactory.queryAllKajmak(function (data) {
            var array = [];
            for (var i = 0; i < data.length; i++) {
                parseInt(data[i].Key);
                data[i].Record.Key = parseInt(data[i].Key);
                array.push(data[i].Record);
            }
            array.sort(function (a, b) {
                return parseFloat(a.Key) - parseFloat(b.Key);
            });
            $scope.all_kajmak = array;
        });
    }
    */

    $scope.getKajmak1 = function (index) {
        var kajmak1 = $scope.all_kajmak[index];
        myService.setKajmak1(kajmak1);
    }

    $scope.getKajmak2 = function (index) {
        var kajmak2 = $scope.all_kajmak[index];
        myService.setKajmak2(kajmak2);
    }
    $scope.mixKajmak = function () {
        var prvi = myService.getKajmak1();
        var drugi = myService.getKajmak2();
        var kolicina1 = Number(prvi.quantity);
        var kolicina2 = Number(drugi.quantity);
        var percentage1 = parseInt($scope.kajmak.percentage1);
        var percentage2 = parseInt($scope.kajmak.percentage2);

        var quantity1 = kolicina1 * (percentage1 / 100);
        var quantity2 = kolicina2 * (percentage2 / 100);

        var sumaKolicina = quantity1 + quantity2;


        var parts1 = prvi.expiration_date.split(/[\s.:]/);
        var mydate1 = new Date(parts1[2], parts1[1] - 1, parts1[0], parts1[4], parts1[5]);
        console.log(parts1);

        var parts2 = drugi.expiration_date.split(/[\s.:]/);
        var mydate2 = new Date(parts2[2], parts2[1] - 1, parts2[0], parts2[4], parts2[5]);

        var finalProductionDate = "";
        var finalExpirationDate = "";
        var current = new Date();
        var y = current.getFullYear().toString();
        var m = (current.getMonth() + 1).toString();
        var d = current.getDate().toString();
        var h = current.getHours().toString();
        var mi = current.getMinutes().toString();
        var ampm1 = h >= 12 ? 'pm' : 'am';
        h = h % 12;
        h = h ? h : 12;
        m = m < 10 ? '0' + m : m;

        finalProductionDate = d + "." + m + "." + y + "." + " " + h + ":" + mi + " " + ampm1;
        if (mydate1 < mydate2) {
            console.log("USlooooo");
            var year = parts1[2];
            var month = parts1[1];
            var day = parts1[0];
            var hour = parts1[4];
            var min = parts1[5];
            var ampm = parts1[6];

            finalExpirationDate = day + "." + month + "." + year + "." + " " + hour + ":" + min + " " + ampm;

        }

        else {
            var year = parts2[2];
            var month = parts2[1];
            var day = parts2[0];
            var hour = parts2[4];
            var min = parts2[5];
            var ampm = parts2[6];

            finalExpirationDate = day + "." + month + "." + year + "." + " " + hour + ":" + min + " " + ampm;
        }

        var newKajmak = {
            id: (prvi.Key).toString() + (drugi.Key).toString(),
            name: prvi.name + "&" + drugi.name,
            //owner: prvi.owner,
            animal: prvi.animal + drugi.animal,
            location: prvi.location + drugi.location,
            quantity: (sumaKolicina).toString(),
            productionDate: finalProductionDate,
            expirationDate: finalExpirationDate,
        }

        var owners = {
            firstOwner: prvi.owner,
            secondOwner: drugi.owner,
            firstName: prvi.name,
            secondName: drugi.name,
            firstID: (prvi.Key).toString(),
            secondID: (drugi.Key).toString()
        }

        appFactory.checkOwners(owners, function (data) {
            console.log("Uredu ckeck");
            if (data.message == "allow") {
                appFactory.recordKajmak(newKajmak, function (data) {
                    //$scope.create_kajmak = data;
                    console.log("U redu");
                });
                if (percentage1 == 100) {
                    appFactory.deleteKajmak(prvi, function (data) {
                        console.log("Kajmak obrisan");
                    });
                } else {
                    prvi.quantity = prvi.quantity - quantity1;
                    console.log(prvi.quantity);
                    console.log("Pozzzvalllo se prvvvviii");
                    var kajmakData = {
                        kajmakID: (prvi.Key).toString(),
                        kajmakQuantity: prvi.quantity
                    };
                    appFactory.changeQuantity(kajmakData, function (data){
                            console.log("U redu");
                    });
                }
                if (percentage2 == 100){
                    appFactory.deleteKajmak(drugi, function (data) {
                        console.log("Kajmak obrisan");
                    });
                } else {
                    console.log("Pozzzvalllo seee");
                    drugi.quantity = drugi.quantity - quantity2;
                    var kajmakData = {
                        kajmakID: (drugi.Key).toString(),
                        kajmakQuantity: drugi.quantity

                    };
                    appFactory.changeQuantity(kajmakData, function (data){
                            console.log("U redu");
                    });
                }
                $scope.poruka = "Kajmak Mixed Successfully!";
            } else {
                $scope.poruka = data.message;
            }
        });
    }

    $scope.logOut = function () {
        console.log("kliknuto na Log Out");
        appFactory.logOut(function (data) {
            console.log(data);
            if (data.message == "ok") {
                $location.path("login");
            }
        });
    }
}]);

app.controller("kajmakNotificationCtrl", ["$scope", "appFactory", "$location", function ($scope, appFactory, $location) {
    console.log("Nalazim se u kajmakNotificationCtrl");
    appFactory.queryAllNotifications(function (data) {
        var niz = [];
        console.log(data.requests.length);
        for (var i = 0; i < data.requests.length; i++) {
            if (data.requests[i] !== "") {
                niz.push(data.requests[i]);
            }
        }
        $scope.all_requests = niz;

        var nizOdgovora = [];
        for (var i = 0; i < data.responses.length; i++) {
            if (data.responses[i] !== "") {
                nizOdgovora.push(data.responses[i]);
            }
        }
        $scope.all_responses = nizOdgovora;
        console.log(data);
    });
    /*
    $scope.queryAllNotifications = function () {
        //var array = ["jkfashfjhsahf","ifasfgayuhi","asuyjtfhdtftyy8u9"];
        appFactory.queryAllNotifications(function (data) {
            var niz = [];
            console.log(data.requests.length);
            for (var i = 0; i < data.requests.length; i++) {
                if (data.requests[i] !== "") {
                    niz.push(data.requests[i]);
                }
            }
            $scope.all_requests = niz;

            var nizOdgovora = [];
            for (var i = 0; i < data.responses.length; i++) {
                if (data.responses[i] !== "") {
                    nizOdgovora.push(data.responses[i]);
                }
            }
            $scope.all_responses = nizOdgovora;
            console.log(data);
        });
    }
    */
    $scope.logOut = function () {
        console.log("kliknuto na Log Out");
        appFactory.logOut(function (data) {
            console.log(data);
            if (data.message == "ok") {
                $location.path("login");
            }
        });
    }
    $scope.approveRequest = function(index) {
        console.log("kliknuto na approve kajmak");
        console.log(index);
        appFactory.approveRequest(index, function(data) {
            console.log("U redu");
            appFactory.queryAllNotifications(function (data) {
                var niz = [];
                console.log(data.requests.length);
                for (var i = 0; i < data.requests.length; i++) {
                    if (data.requests[i] !== "") {
                        niz.push(data.requests[i]);
                    }
                }
                $scope.all_requests = niz;

                var nizOdgovora = [];
                for (var i = 0; i < data.responses.length; i++) {
                    if (data.responses[i] !== "") {
                        nizOdgovora.push(data.responses[i]);
                    }
                }
                $scope.all_responses = nizOdgovora;
                console.log(data);
            });
        });
    }
    $scope.rejectRequest = function(index) {
        console.log("kliknuto na reject kajmak");
        console.log(index);
        appFactory.rejectRequest(index, function(data) {
            console.log("U redu");
            appFactory.queryAllNotifications(function (data) {
                var niz = [];
                console.log(data.requests.length);
                for (var i = 0; i < data.requests.length; i++) {
                    if (data.requests[i] !== "") {
                        niz.push(data.requests[i]);
                    }
                }
                $scope.all_requests = niz;

                var nizOdgovora = [];
                for (var i = 0; i < data.responses.length; i++) {
                    if (data.responses[i] !== "") {
                        nizOdgovora.push(data.responses[i]);
                    }
                }
                $scope.all_responses = nizOdgovora;
                console.log(data);
            });
        });
    }
}]);


// Angular Factory
app.factory('appFactory', function ($http) {
    var factory = {};

    factory.loginUser = function (data, callback) {
        var user = data.username + "-" + data.password;
        $http.get('/login/' + user).success(function (output) {
            callback(output);
        });
    }

    factory.addUser = function (data, callback) {
        console.log(data);
        var user = data.email + "-" + data.username + "-" + data.password + "-" + data.organization;
        console.log(user);
        $http.get('/addUser/' + user).success(function (output) {
            callback(output);
        });
    }

    factory.logOut = function (callback) {
        $http.get('/logout').success(function (output) {
            callback(output);
        });
    }

    factory.queryAllKajmak = function (callback) {
        $http.get('/get_all_kajmak/').success(function (output) {
            callback(output)
        });
    }

    factory.checkOwners = function (data, callback) {
        var kData = data.firstOwner + "-" + data.secondOwner + "-" + data.firstName + "-" + data.secondName + "-" + data.firstID + "-" + data.secondID;
        $http.get('/check_owners/' + kData).success(function (output) {
            callback(output);
        });
    }
    
  

    factory.recordKajmak = function (data, callback) {

        var kajmak = data.id + "-" + data.name + "-" + data.animal + "-" + data.location + "-" + data.quantity + "-" + data.productionDate + "-" + data.expirationDate;
        $http.get('/add_kajmak/' + kajmak).success(function (output) {
            callback(output)
        });
    }

    factory.changeOwner = function (data, callback) {
        console.log("uslo");
        var owner = data.id + "-" + data.name + "-" + data.oldOwner;
        $http.get('/change_owner/' + owner).success(function (output) {
            callback(output)
        });
    }

    factory.changeQuantity = function (data, callback) {
        var quantity = data.kajmakID + "-" + data.kajmakQuantity;
        $http.get('/change_quantity/' + quantity).success(function (output) {
            callback(output)
        });
    }


    factory.deleteKajmak = function (data, callback) {
        console.log("uslo u deleteKajmak");
        console.log(data);
        var kjmk = data.Key + "-" + data.name + "-" + data.owner + "-" + data.animal + "-" + data.location + "-" + data.quantity + "-" + data.production_date + "-" + data.expiration_date;
        $http.get('/delete_kajmak/' + kjmk).success(function (output) {
            callback(output);
        });
    }

    factory.queryAllUsers = function (callback) {
        $http.get('/get_all_users').success(function (output) {
            callback(output);
        });
    }

    factory.queryAllNotifications = function (callback) {
        $http.get('/get_all_notifications/').success(function (output) {
            console.log(output);
            callback(output);
        });
    }

    factory.approveRequest = function(data, callback) {
        $http.get('/send_approve/'+ data).success(function (output) {
            callback(output);
        });    
    }

    factory.rejectRequest = function(data, callback) {
        $http.get('/send_reject/' + data).success(function (output) {
            callback(output);
        });
    }

    return factory;
});

app.factory('myService', function () {
    var myjsonObj = null;//the object to hold our data
    var kajmak1Obj = null;
    var kajmak2Obj = null;
    return {
        getJson: function () {
            return myjsonObj;
        },
        getKajmak1: function () {
            return kajmak1Obj;
        },
        getKajmak2: function () {
            return kajmak2Obj;
        },
        setJson: function (value) {
            myjsonObj = value;
        },
        setKajmak1: function (value) {
            kajmak1Obj = value;
        },
        setKajmak2: function (value) {
            kajmak2Obj = value;
        }
    }
});