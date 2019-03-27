"use strict";

$(function () {
    class Box {
        constructor($box, $left, $twIcon, $center, $twName, $twId, $twText) {
            this.$box = $box; this.$left = $left; this.$twIcon = $twIcon;
            this.$center = $center; this.$twName = $twName;
            this.$twId = $twId; this.$twText = $twText;
        }
    }

    let colorList = { '992045971268747267': '#bd7448' };
    Object.assign(colorList, { '992045252167942145': '#900c43' });
    Object.assign(colorList, { '992044186252685312': '#5b8fce' });
    Object.assign(colorList, { '992043311476101123': '#da62b9' });
    Object.assign(colorList, { '992042416445128706': '#df7164' });
    Object.assign(colorList, { '992041545690824705': '#6a5b84' });
    Object.assign(colorList, { '992039541547585536': '#8a6cce' });
    Object.assign(colorList, { '992036953804558336': '#587c4f' });
    Object.assign(colorList, { '992034633104543747': '#c9bf4e' });
    Object.assign(colorList, { '992031495760986113': '#e796bc' });
    Object.assign(colorList, { '972262397640548352': '#d04677' });
    Object.assign(colorList, { '971926028842033152': '#e4184b' });

    function genBox(boxNum) {
        let box = new Box(
            $('<div id="box"></div>'), $('<div id="left"></div>'), $('<img id="twIcon">'),
            $('<div id="center"></div>'), $('<div id="twName"></div>'),
            $('<div id="twId"></div>'), $('<div id="twText"></div>')
        );

        box.$box.css({
            'cssText': 'font-size: 20px !important;',
            width: '100%',
            position: 'fixed',
            left: 0,
            bottom: '-100%',
            zIndex: '1000000',
            opacity: 0.9,
            background: '#55acee',
            padding: '5px'
        });
        box.$left.css({
            float: 'left',
            'margin-right': '10px'
        });
        box.$center.css('text-align', 'left');
        box.$twName.css({
            color: '#FFFFFF'
        });
        box.$twId.css('color', '#00FF00');
        box.$twText.css('color', '#FFFFFF');

        return box;
    }

    function setValueBox(box, tweet) {
        const twIconUrl = tweet.user.profile_image_url;
        const twUrl = 'https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str;
        const twId = tweet.user.screen_name;
        const twName = tweet.user.name;
        const twText = tweet.text;
        const twColor = colorList[tweet.user.id_str];

        box.$box.css({
            background: twColor,
        });

        box.$twIcon.attr({
            width: 48,
            height: 48,
            src: twIconUrl
        });

        box.$twName.attr('href', twUrl);
        box.$twName.text(twName);
        box.$twId.text(twId);
        box.$twText.text(twText);
    }

    function setBoxHtml(box) {
        $('body').append(box.$box);
        $('#box').append(box.$left, box.$center);
        $('#left').append(box.$twIcon);
        $('#center').append(box.$twName, box.$twId, box.$twText);
    }

    function moveToTop(box) {
        return box.$box.animate({ 'bottom': '0%' }, 2000, 'linear').promise();
    }

    function backToBottom(box) {
        return box.$box.animate({ 'bottom': '-100%' }, 2000, 'linear').promise();
    }

    function sleep(mSec) {
        return new Promise(resolve => setTimeout(resolve, mSec));
    }

    let insBox, twNum, twNumOld;
    let timeRecord, isPlaying, nextFlag;
    let timeDiff;
    let timeoutID, intervalID;

    chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {
            if (request.message == 'set') {
                insBox = genBox(1);
                twNum = 0;
                timeRecord = $('.ytp-time-current').text();
                isPlaying = ($('.ytp-play-button').attr('title') == '一時停止（k）' ? true : false);

                let displaySameCount = 0;
                console.log(request);

                //tweetの抽出と範囲時間による選別
                let tweets = request.tweets.reverse();

                if (tweets.length != 0) {
                    tweets = tweets.filter((element) =>
                        moment(element.created_at)
                            .isBetween(request.actualStartTime, request.actualEndTime)
                    );
                    console.log(tweets);

                    timeDiff = new Array(tweets.length);
                    timeoutID = new Array(tweets.length);

                    intervalID = window.setInterval(() => {
                        if (timeRecord == $('.ytp-time-current').text() && isPlaying) {
                            displaySameCount++;
                        } else {
                            displaySameCount = 0;
                        }

                        isPlaying = ($('.ytp-play-button').attr('title') == '一時停止（k）' ? true : false);
                        timeRecord = $('.ytp-time-current').text();
                        if (displaySameCount < 4 || nextFlag) {
                            console.log(`displaySameCount ${displaySameCount}`);
                            twNumOld = twNum;
                            twNum = tweets.findIndex(element =>
                                (moment(element.created_at).diff(
                                    moment(request.actualStartTime).add({
                                        hours: timeRecord.length < 7 ? 0 : timeRecord[0],
                                        minutes: timeRecord.slice(-5, -3),
                                        seconds: timeRecord.slice(-2)
                                    }).add({
                                        minutes: isPlaying ? Math.floor(displaySameCount / 60) : 0,
                                        seconds: isPlaying ? Math.floor(displaySameCount % 60) : 0
                                    })
                                )) > 0
                            );
                            if (twNumOld != twNum && twNum !== -1) {
                                for (let index = twNumOld - 1; index <= twNumOld + 1; index++) {
                                    clearTimeout(timeoutID[index]);
                                }
                            }
                            //ツイート数が1,2のときに合わせたら複雑になった。
                            //そのうち直す。                        
                            twNum += (twNum == 0 ? 1 : ((twNum == tweets.length - 1) ? (tweets.length == 2 ? 1 : -1) : 0));
                            for (let index = twNum - 1; index <= twNum + 1 && tweets[index] !== undefined; index++) {
                                timeDiff[index] = moment(tweets[index].created_at).diff(
                                    moment(request.actualStartTime).add({
                                        hours: timeRecord.length < 7 ? 0 : timeRecord[0],
                                        minutes: timeRecord.slice(-5, -3),
                                        seconds: timeRecord.slice(-2)
                                    }).add({
                                        minutes: isPlaying ? Math.floor(displaySameCount / 60) : 0,
                                        seconds: isPlaying ? Math.floor(displaySameCount % 60) : 0
                                    })
                                )

                                if (isPlaying && timeDiff[index] >= 0) {
                                    window.clearTimeout(timeoutID[index]);
                                    timeoutID[index] = window.setTimeout(async () => {
                                        if (isPlaying) {

                                            setValueBox(insBox, tweets[index]);
                                            setBoxHtml(insBox);

                                            console.log(`${tweets[index].text} ${index}`);
                                            nextFlag = true;
                                            await moveToTop(insBox);
                                            await sleep(10000);
                                            await backToBottom(insBox);
                                            window.setTimeout(async () => { nextFlag = false; }, 1500);
                                        }
                                    }, timeDiff[index])
                                }
                                console.log(`${index} : ${timeoutID[index]} : ${timeDiff[index] / 1000}`);
                            }
                        } else {
                            console.log(`${$('.ytp-time-current').text()} ${isPlaying}`);
                        }
                    }, 999);
                } else {
                    console.log('No tweets in this period.');
                }
            } else if (request.message == 'stop') {
                console.log('stop is pushed.');
                timeoutID.forEach(element => {
                    window.clearTimeout(element);
                });
                window.clearInterval(intervalID)
            } else {
                console.log('message you send is undefined.');
            }
        }
    );
});