/*
Modals
Copyright (C) 2015-2016 jackw01
*/

$(".modal-close-button").click(function(event) {

    $(event.target).parent().parent().parent().fadeToggle(200);
});

$(".validate-number").keyup(function(event) {

    $("#" + event.target.id).val($("#" + event.target.id).val().replace(/[^0-9\.]/g, ""));
});

$(".validate-positive").blur(function(event) {

    $("#" + event.target.id).val($("#" + event.target.id).val().replace(/[^0-9\.]/g, ""));

    var value = $("#" + event.target.id).val();

    if (isNaN(value) || value < 1) {

        $("#" + event.target.id).addClass("text-input-error");

    } else {

        $("#" + event.target.id).removeClass("text-input-error");
    }
});

$(".validate-positive-unrequired").blur(function(event) {

    $("#" + event.target.id).val($("#" + event.target.id).val().replace(/[^0-9\.]/g, ""));

    var value = $("#" + event.target.id).val();

    if (isNaN(value) || value < 0 || value === 0) {

        $("#" + event.target.id).addClass("text-input-error");

    } else {

        $("#" + event.target.id).removeClass("text-input-error");
    }
});

$(".validate-counting").blur(function(event) {

    $("#" + event.target.id).val($("#" + event.target.id).val().replace(/[^0-9\.]/g, ""));

    var value = $("#" + event.target.id).val();

    if (isNaN(value) || value < 0 || value === "") {

        $("#" + event.target.id).addClass("text-input-error");

    } else {

        $("#" + event.target.id).removeClass("text-input-error");
    }
});

$(".validate-counting-unrequired").blur(function(event) {

    $("#" + event.target.id).val($("#" + event.target.id).val().replace(/[^0-9\.]/g, ""));

    var value = $("#" + event.target.id).val();

    if (isNaN(value) || value < 0) {

        $("#" + event.target.id).addClass("text-input-error");

    } else {

        $("#" + event.target.id).removeClass("text-input-error");
    }
});
