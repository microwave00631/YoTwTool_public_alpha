"use strict";

/*
chrome.pageAction.onClicked.addListener(tab=>{
    console.log("heraaaaaaeraaaaaaah");
});
*/
chrome.runtime.onInstalled.addListener(function () {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: { hostEquals: 'www.youtube.com' },
            })],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender);
        console.log(request);
        let url = new URL(request);
        let videoIdQuery = url.search;

        fetch('https://yotwtool.net' + videoIdQuery, {
            mode: 'cors'//,    ここもパッケージ化するときに直して
            //credentials: 'include'
        })
            .then(Response => Response.text())
            .then(function (text) {
                sendResponse(text);
            });

        return true;
    }
);
