function requireTweets() {
    console.log('require tweets');
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        chrome.runtime.sendMessage(tabs[0].url, (response) => {
            response = JSON.parse(response);
            Object.assign(response, {message: 'set'});
            chrome.tabs.sendMessage(tabs[0].id, response);
        });
    });
}

function stopNotification() {
    console.log('stop notification');

    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { message: 'stop' });
    });

}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('getButton')
        .addEventListener('click', requireTweets);
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('stopButton')
        .addEventListener('click', stopNotification);
});