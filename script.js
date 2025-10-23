// Debounce utility function
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Format paint SVG based on window size
function formatPaint() {
    var maxWindow = parseFloat($(".first").css("--mw"));
    var currentWindow = $(window).width();
    if (currentWindow < maxWindow) {
        var paintRatio = currentWindow / maxWindow;
        $(".first svg,#drawing svg").each(function() {
            var getOldS = parseFloat(1 - paintRatio);
            $(this).css("--ns", getOldS);
        });
    } else {
        $(".first svg,#drawing svg").css("--ns", 0);
    }
}

// Make grid layout
function makeGrid() {
    var getSize = parseFloat($(".content").outerWidth()) / 16 / 16;
    $(".first").css("--g", getSize);
    gridSize = parseFloat($(".grid").css("--g")) * 16;
    gridDown = false;
    gridSelected = false;
    formatPaint();
}

makeGrid();

$(window).on("resize", function() {
    makeGrid();
});

// Spotify search with debounce
$('.spotSearch input').keyup(debounce(function() {
    var getVal = $('.spotSearch input').val();
    $.ajax({
        url: "https://straw.page/power/spotify/search",
        method: "GET",
        data: { q: getVal },
        success: function(data) {
            $(".spotResults").empty();
            for (var i = 0; i < data.length; i++) {
                $(".spotResults").append(`<div class="spotItem"><img src="${data[i].album_image_url}"><div class="spotMeta" data-sound="${data[i].preview}" data-mid="${data[i].id}"><h5>${data[i].name}</h5><p><i class="fab fa-spotify"></i>${data[i].artist_list}</p></div></div>`);
            }
        }
    });
}, 500));

// Calculate editor height
function calculateEditorHeight() {
    var getScroll = $(document).scrollTop();
    $(".content").css("height", "");
    var getHeight = $(".content")[0].scrollHeight;
    var getWindowHeight = $(window).outerHeight();
    $(".content").css("height", getHeight + 80);
    $(document).scrollTop(getScroll);
}

calculateEditorHeight();

$(window).on('load', function() {
    calculateEditorHeight();
    if (typeof umami !== 'undefined') {
        ok = umami;
        if (typeof ok.track == "undefined") {
            ok.track = function() {}
        }
    }
});

// Eyeball tracking effect
$(document).on("mousemove touchmove", function(e) {
    var currentY = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY;
    var currentX = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX;
    $(".eyeball span").each(function() {
        var standardR = parseFloat($(this).closest(".element").css("--r"));
        var eye = $(this);
        var eyeX = (eye.offset().left) + (eye.width() / 2);
        var eyeY = (eye.offset().top) + (eye.height() / 2);
        rad = Math.atan2(currentX - eyeX, currentY - eyeY);
        rot = (rad * (180 / Math.PI) * -1) + 180;
        rot -= standardR;
        eye.css({
            '-webkit-transform': 'rotate(' + rot + 'deg)',
            '-moz-transform': 'rotate(' + rot + 'deg)',
            '-ms-transform': 'rotate(' + rot + 'deg)',
            'transform': 'rotate(' + rot + 'deg)'
        });
    });
});

// Branding hover effect for small screens
if ($(window).width() < 5) {
    $(".branding").mouseover(function() {
        $(".brandingContent").show(150)
    }).mouseleave(function() {
        $(".brandingContent").hide(150)
    });
}

// User agent detection
var findr = ['Instagram', 'Snapchat', 'FB'];

function containsCheck(target, pattern) {
    var value = 0;
    pattern.forEach(function(word) {
        value = value + target.includes(word);
    });
    return (value === 1)
}

if (containsCheck(navigator.userAgent, findr)) {
    $(".first").addClass("inst");
}

// Turnstile initialization for AMA
let turnToken;
if ($(".element[data-type=gimmick-ama]").length > 0) {
    turnstile.ready(function() {
        turnstile.render($(".element[data-type=gimmick-ama]")[0], {
            sitekey: "0x4AAAAAABVM5d6B7XsBIXP-",
            callback: function(token) {
                turnToken = token;
            },
        });
    });
}

// AMA submit handler
$(document).on("click", ".element[data-type=gimmick-ama] button", function() {
    var parentCanv = $(this).closest(".element");
    var question = $(parentCanv).find("input").val();
    var prompt = $(parentCanv).find(".asker input").attr("placeholder");
    var getID = $(parentCanv).data("uid");
    var music = null;
    if (question.length < 1) {
        return;
    }
    if ($(parentCanv).data("mid")) {
        music = $(parentCanv).data("mid");
    }
    $(parentCanv).addClass("doneArt");
    $.ajax({
        type: "POST",
        url: "/gimmicks/ama",
        data: {
            q: question,
            p: prompt,
            i: getID,
            m: music,
            t: turnToken
        },
        success: function(response) {
            try {
                ok.track("sent ama!");
            } catch (e) {}
            $(parentCanv).find(".askerSend button").text("Sent! 😎");
        }
    });
});

// Audio elements management
var audioElements = {};
var spotEls = {};

$(document).on("click", ".element[data-sound]", function() {
    if ($(this).data("type") == "spotify") {
        $(this).toggleClass("playing");
        if ($(this).hasClass("playing")) {
            $(this).find(".imgWrap i").attr("class", "fas fa-pause");
        } else {
            $(this).find(".imgWrap i").attr("class", "fas fa-play");
        }
    }
    var soundID = $(this).data("sound");
    if (!audioElements[soundID]) {
        audioElements[soundID] = new Audio(soundID);
    }
    var audio = audioElements[soundID];
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
});

// Firefox detection
let userAgent = navigator.userAgent;
if (userAgent.match(/firefox|fxios/i)) {
    $("body").addClass("ff");
}

// Touch device detection
function isTouchDevice() {
    return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
}

// Majority vote talking animation
function startMajorityVoteTalk(closestEl = null) {
    var targetElements = closestEl ? $(closestEl).find(".activeTalk") : $(".activeTalk");
    targetElements.each(function() {
        var talkCtx = this;
        var getText = $(this).data("talk").trim();
        $(this).text("");
        $(this).closest(".element").addClass("disableTmp");
        for (let i = 0; i < getText.length; i++) {
            setTimeout(function() {
                if ($(talkCtx).text().length === i) {
                    $(talkCtx).append(getText[i]);
                }
                if (i === getText.length - 1) {
                    $(talkCtx).closest(".element").removeClass("disableTmp");
                }
            }, 20 * i);
        }
    });
}

$(".element[data-type=majorityvote").each(function() {
    $(this).find(".innerTalking p").eq(0).addClass("activeTalk");
    startMajorityVoteTalk();
});

// Friends list loader
if ($(".element[data-type=friends").length > 0) {
    $.ajax({
        url: "/get/following",
        method: "GET",
        success: function(data) {
            $(".innerFriendsList").empty();
            $(".innerFriendsList").each(function() {
                for (var i = 0; i < data.sites.length; i++) {
                    $(this).append(`<div class="followingDon" data-site="${data.sites[i].site}"><a href="https://${data.sites[i].site}.straw.page"><div class="innerFollowingDon"><img src="${data.sites[i].pic}" />${data.sites[i].site.length > 7 ? '<div class="marquee" data-fun-text="' + data.sites[i].site + '"></div>' : '<p>' + data.sites[i].site + '</p>'}</div></a></div>`);
                }
            });
        }
    });
}

// Talking interaction handler
$(document).on("click", ".innerTalking", function() {
    var ctxTalk = $(this).find(".activeTalk");
    var ctxScene = $(this).closest(".scene");
    var closestEl = $(this).closest(".element");
    if ($(ctxTalk).next("p").length > 0) {
        $(ctxTalk).empty();
        $(ctxTalk).removeClass("activeTalk");
        $(ctxTalk).next("p").addClass("activeTalk");
        startMajorityVoteTalk(closestEl);
    } else {
        if ($(ctxScene).next(".scene").length > 0) {
            $(ctxScene).next(".scene").addClass("active");
            $(ctxScene).find(".activeTalk").removeClass("activeTalk");
            $(ctxScene).removeClass("active");
            $(ctxScene).next(".scene").find(".innerTalking p").eq(0).addClass("activeTalk");
            startMajorityVoteTalk(closestEl);
        } else {
            $(".activeTalk").removeClass("activeTalk");
            $(this).closest(".element").find(".active").removeClass("active");
            $(this).closest(".element").find(".scene").eq(0).addClass("active");
            $(this).closest(".element").find(".scene.active .innerTalking p").eq(0).addClass("activeTalk");
            startMajorityVoteTalk(closestEl);
        }
    }
});

// Spotify item selection
var amaCtx;
$(document).on("click", ".spotItem", function() {
    $(amaCtx).find("img").remove();
    $(amaCtx).find(".askExtra").append(`<img src="${$(this).find("img").attr("src")}">`);
    $(amaCtx).data("song", $(this).find("h5").text());
    $(amaCtx).data("artist", $(this).find("p").text());
    $(amaCtx).data("sound", $(this).find(".spotMeta").attr("data-sound"));
    $(amaCtx).data("mid", $(this).find(".spotMeta").attr("data-mid"));
    $(".spotSearch").removeClass("bringUp");
});

$(document).on("click", ".askExtra", function() {
    amaCtx = $(this).closest(".element");
    $(".spotSearch").addClass("bringUp");
});

$(document).on("click", ".spotSearch .closer", function() {
    $(".spotSearch").removeClass("bringUp");
});

// Scroll to element
$(document).on("click", ".element[data-scrollto]", function(e) {
    e.stopImmediatePropagation();
    var getScrollID = $(this).data("scrollto").trim();
    $('html, body').animate({
        scrollTop: $(`.element[data-uid=${getScrollID}]`).offset().top
    }, 400);
});

// Utility functions for height calculation
function convertRemToPixels(rem) {
    return rem * parseFloat(getComputedStyle($(".content")[0]).fontSize);
}

function calculateH(desiredHeight) {
    const remInPixels = convertRemToPixels(1);
    const multiplier = 2.34375;
    const baseHeight = remInPixels * multiplier;
    const h = desiredHeight / baseHeight;
    return h;
}

// Blog content height adjustment
$(window).on("load", function() {
    $(".element[data-type=blogcontent]").each(function() {
        var getBound = $(this)[0].getBoundingClientRect();
        var oldH = parseFloat($(this).css("--h"));
        var oldY = parseFloat($(this).css("--y"));
        var diffH = calculateH(getBound.height) - oldH;
        $(".element").not(this).each(function() {
            var ctxBound = $(this)[0].getBoundingClientRect();
            if (ctxBound.left < getBound.right && ctxBound.right > getBound.left) {
                var ctxY = parseFloat($(this).css("--y"));
                if (ctxY >= oldY + oldH) {
                    $(this).css("--y", ctxY + diffH);
                }
            }
        });
    });
    calculateEditorHeight();
});

// Button click tracking
$(document).on("click", "a", function() {
    if ($(this).find(".element[data-type=button2]").length > 0) {
        var getLinkText = $(this).text().trim();
        ok.track("clicked: " + getLinkText);
    }
});

// Extra info finder
function findExtraInfo(uid) {
    for (var i = 0; i < extraInfo.length; i++) {
        if (extraInfo[i].uid == uid) {
            return extraInfo[i];
        }
    }
    return false;
}

var extraInfo = [];

// Meme controls
$(document).on("click", ".memeControls i.fa-plus", function() {
    $(this).closest(".element").find(".memeGallery").fadeIn(100);
});

$('.memeGallery input').keyup(function() {
    var self = this;
    debounce(function() {
        var getVal = $(self).val();
        $.ajax({
            url: "/search/stickers",
            method: "POST",
            data: { query: getVal },
            success: function(data) {
                $(self).closest(".element").find(".memeGallResults").empty();
                for (var i = 0; i < data.gifs.length; i++) {
                    $(self).closest(".element").find(".memeGallResults").append(`<img src="${data.gifs[i]}">`);
                }
            }
        });
    }, 300)();
});

$(document).on("click", ".memeControls i.fa-plus,.memeInp i", function() {
    $(this).closest(".element").find(".memeGallery").toggleClass("showMemeGallery");
});

// Meme generator with Konva
$('.element[data-type=memegen]').each(function() {
    const $element = $(this);
    const $container = $element.find('.officialMemeContainer');
    const uniqueID = 'container-' + Math.random().toString(36).substr(2, 9);
    $container.attr('id', uniqueID);
    const stage = new Konva.Stage({
        container: uniqueID,
        width: $container.outerWidth(),
        height: $container.outerHeight()
    });
    const layer = new Konva.Layer();
    stage.add(layer);
    const bgImageSrc = $(this).data("img");;
    const bgImage = new Image();
    bgImage.crossOrigin = "anonymous";
    bgImage.src = bgImageSrc;
    let backgroundImage;
    bgImage.onload = function() {
        const canvasWidth = stage.width();
        const canvasHeight = stage.height();
        const imgWidth = bgImage.width;
        const imgHeight = bgImage.height;
        const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        const x = (canvasWidth - scaledWidth) / 2;
        const y = (canvasHeight - scaledHeight) / 2;
        backgroundImage = new Konva.Image({
            image: bgImage,
            x: x,
            y: y,
            width: scaledWidth,
            height: scaledHeight,
            listening: false,
        });
        layer.add(backgroundImage);
        layer.moveToBottom();
        layer.draw();
    };
    $element.on('click', '.memeGallResults img', function() {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = $(this).attr('src');
        $(this).closest(".memeGallery").removeClass("showMemeGallery");
        img.onload = function() {
            const maxSize = 100;
            let scaleFactor = 1;
            if (img.width > img.height) {
                scaleFactor = maxSize / img.width;
            } else {
                scaleFactor = maxSize / img.height;
            }
            const scaledWidth = img.width * scaleFactor;
            const scaledHeight = img.height * scaleFactor;
            const sticker = new Konva.Image({
                image: img,
                x: (stage.width() - scaledWidth) / 2,
                y: (stage.height() - scaledHeight) / 2,
                width: scaledWidth,
                height: scaledHeight,
                draggable: true,
            });
            layer.add(sticker);
            layer.draw();
            const tr = new Konva.Transformer({
                nodes: [sticker],
                rotateEnabled: true,
                enabledAnchors: [
                    'top-left', 'top-right', 'bottom-left', 'bottom-right',
                    'middle-left', 'middle-right', 'top-center', 'bottom-center',
                ],
                flipEnabled: true,
                stroke: 'black',
                strokeWidth: 2,
                anchorStroke: 'black',
                anchorFill: 'black',
                anchorSize: 6,
                borderStroke: 'black',
                borderStrokeWidth: 1,
            });
            layer.add(tr);
            layer.draw();
            const $stickerButtons = $element.find('.stickerButtons');
            sticker.on('click', function() {
                tr.nodes([sticker]);
                layer.draw();
                $stickerButtons.addClass("showMemeGallery");
            });
            stage.on('click', function(e) {
                if (e.target === stage) {
                    tr.nodes([]);
                    layer.draw();
                    $stickerButtons.removeClass("showMemeGallery");
                }
            });
            $stickerButtons.find('.fa-trash').on('click', function() {
                sticker.destroy();
                tr.destroy();
                layer.draw();
                $stickerButtons.removeClass("showMemeGallery");
            });
            $stickerButtons.addClass("showMemeGallery");
        }
    });
    $element.find('.downloadMeme').on('click', function() {
        const transformers = stage.find('Transformer');
        transformers.forEach(tr => tr.hide());
        layer.draw();
        const dataURL = stage.toDataURL({ pixelRatio: 3 });
        transformers.forEach(tr => tr.show());
        layer.draw();
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'meme.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    $element.find('.resetMeme').on('click', function() {
        layer.destroyChildren();
        layer.add(backgroundImage);
        layer.draw();
    });
    $element.find('.changeBackground').on('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(event) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                const newBgImage = new Image();
                newBgImage.src = e.target.result;
                newBgImage.crossOrigin = "anonymous";
                newBgImage.onload = function() {
                    const canvasWidth = stage.width();
                    const canvasHeight = stage.height();
                    const imgWidth = newBgImage.width;
                    const imgHeight = newBgImage.height;
                    const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
                    const scaledWidth = imgWidth * scale;
                    const scaledHeight = imgHeight * scale;
                    const x = (canvasWidth - scaledWidth) / 2;
                    const y = (canvasHeight - scaledHeight) / 2;
                    backgroundImage.image(newBgImage);
                    backgroundImage.width(scaledWidth);
                    backgroundImage.height(scaledHeight);
                    backgroundImage.position({ x: x, y: y });
                    layer.draw();
                };
            };
            reader.readAsDataURL(file);
        };
        input.click();
    });
});
