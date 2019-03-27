const https = require('https');
const url = require('url');
const fetch = require('node-fetch');
const moment = require('moment-timezone');
const fs = require('fs');
const conf = require('./conf');
require('dotenv').config();

const Idol = require('./idol.js');
let idolClub = new Array();
idolClub.push( MokotaMememe = new Idol(
		'mokomeme_ch', '#もこ田めめめ', 'UCz6Gi81kE6p5cdW1rT0ixqw'
	)
);

idolClub.push( KakyoinChieri = new Idol(
		'chieri_kakyoin', '#花京院ちえり', 'UCP9ZgeIJ3Ri9En69R0kJc9Q'
	)
);

idolClub.push( YozakuraTama = new Idol(
		'YozakuraTama', '#夜桜たま', 'UCOefINa2_BmpuX4BbHjdk9A'
	)
);

idolClub.push( UshimakiRiko = new Idol(
		'UshimakiRiko', '#牛巻りこ', 'UCKUcnaLsG2DeQqza8zRXHiA'
	)
);
	
idolClub.push( KaguraSuzu = new Idol(
		'kagura_suzu', '#神楽すず', 'UCUZ5AlC3rTlM-rA2cj5RP6w'
	)
);
	
idolClub.push( CarroPino = new Idol(
		'carro_pino', '#カルロピノ', 'UCMzxQ58QL4NNbWghGymtHvw'
	)
); 
	
idolClub.push( KisoAzuki = new Idol(
		'KisoAzuki', '#木曽あずき', 'UCmM5LprTu6-mSlIiRNkiXYg'
	)
);
	
idolClub.push( KitakamiFutaba = new Idol(
		'KitakamiFutaba', '#北上双葉', 'UC5nfcGkOAm3JwfPvJvzplHg'
	)
);
	
idolClub.push( NekonokiMochi = new Idol(
		'nekonoki_mochi', '#猫乃木もち', 'UC02LBsjt_Ehe7k0CuiNC6RQ'
	)
);
	
idolClub.push( YamatoIori = new Idol(
		'YamatoIori', '#ヤマトイオリ', 'UCyb-cllCkMREr9de-hoiDrg'
	)
);
	
idolClub.push( KongoIroha = new Idol(
		'KongoIroha', '#金剛いろは', 'UCiGcHHHT3kBB1IGOrv7f3qQ'
	)
); 
	
idolClub.push( YaezawaNatori = new Idol(
		'YaezawaNatori', '#八重沢なとり', 'UC1519-d1jzGiL1MPTxEdtSA'
	)
);

class special{
		constructor(twitterTag, videoId){
				this.twitterTag = twitterTag;
				this.videoId = videoId;
		}
}

let specials = new Array();
specials.push(new special('#怪獣めめごん', 'I2dCa1LuDd4'));


var Twitter = require('twitter');

/*
let token = require('./token.json');
const bearer = Buffer.from(token.consumer_key + ':' + token.consumer_secret).toString('base64');
var client = new Twitter({
	consumer_key: token.consumer_key,
	consumer_secret: token.consumer_secret,
	bearer_token: bearer
});
*/

var client = new Twitter({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const youtubeKey = process.env.YOUTUBE_API_KEY;
/*
client.get('lists/members', {
		slug: 'list',
		owner_screen_name: 'YozakuraTama'
	}, function(error, tweets, response){  

	console.log(tweets);
});
client.get('lists/statuses',{
		slug: 'list',
		owner_screen_name: idolClub[idolClub.indexOf(YozakuraTama)].twitterId
	}, function(error, tweets, response){  
	console.log(tweets);
});
*/
async function twitterSearch(idolNum, tweetsTimeSet, videoId){
	let date = tweetsTimeSet.actualStartTime.substring(0,10);
	let query = '';
	let specialIndex = specials.findIndex(element=>element.videoId==videoId);

	idolClub.forEach(function(element){
		query += (' from:' + element.twitterId + ' OR');
	});
	query = query.slice(0, -3);

	if(specialIndex!=-1){
		query += ` AND ${specials[specialIndex].twitterTag}`;
	}else{
		query += ` AND ${idolClub[idolNum].twitterTag}`;
	}

	query += ` since:${date}`;
	query += ` until:${moment(date).add(1, 'days').format("YYYY-MM-DD")}`;
	query += ' exclude:retweets';
	console.log(query);

	const tweets = await client.get('search/tweets', {
		q: query,
		count: 100,
		include_entities: false
	});
	tweetsTimeSet.tweets = tweets.statuses;

	fileName = `gems/${videoId}.json`;
	fs.writeFileSync(fileName, JSON.stringify(tweetsTimeSet, null, '\t'));
}

async function fetchYoutube(videoId, youtubeKey){
	let actualStartTime;
	let actualEndTime;
	let channelId;
	await fetch(
		'https://www.googleapis.com/youtube/v3/videos?id=' + videoId +
		'&key=' + youtubeKey + '&part=snippet,liveStreamingDetails' +
		'&fields=items(snippet/channelId,liveStreamingDetails(actualStartTime,actualEndTime))'
	).then(function(response){
		return response.json()
	}).then(function(json){
		actualStartTime = moment(json.items[0].liveStreamingDetails.actualStartTime).tz('Asia/Tokyo').format();
		actualEndTime = moment(json.items[0].liveStreamingDetails.actualEndTime).tz('Asia/Tokyo').format();
		channelId = json.items[0].snippet.channelId;

		//console.log('actualStartTime: ' + actualStartTime);
		//console.log('actualEndTime: ' + actualEndTime);
	});

	return {actualStartTime, actualEndTime, channelId};
}

const options = {
			key: fs.readFileSync(conf.key),
			cert: [fs.readFileSync(conf.cert)],
			ca:   [fs.readFileSync(conf.chain), fs.readFileSync(conf.fullchain)]
}

const httpsServ = https.createServer(options,
	async function(req, res){
		let tweetsTimeSet = new Object();
		let videoId, videoDetails, fileName, queryReceived;

		queryReceived = url.parse(req.url, true).query;
		videoId = queryReceived.v;
		fileName = `gems/${videoId}.json`;
		try{
			if(videoId.length==11){
				try{
					fs.accessSync(fileName);
					console.log(fileName + ' can access');
				} catch (err) {
					console.log(fileName + ' make now');
					videoDetails = await fetchYoutube(videoId, youtubeKey);
					idolNum = idolClub.findIndex((element)=>{
						return element.youtubeId==videoDetails.channelId;
					});

					tweetsTimeSet.actualStartTime = videoDetails.actualStartTime;
					tweetsTimeSet.actualEndTime = videoDetails.actualEndTime;
					tweetsTimeSet.tweets = [];
					await twitterSearch(idolNum, tweetsTimeSet, videoId);
					console.log(videoDetails);
					console.log(tweetsTimeSet);
				}
			}else{
				console.log(`err videoId.length=${videoId.length}`);	
				fileName = 'err.json';
			}
		}catch (err) {
			console.log('err query v did not appear in request'); 	
			fileName = 'err.json';
		}
		res.writeHead(200, {'MIME-Type': 'application/javascript'});
		res.writeHead(200, {
			'Access-Control-Allow-Origin': '*'//'chrome-extension://bfmkdpdeocechlnoaehgajcnemiolkbh'
			//'Access-Control-Allow-Credentials': 'true'
		});
		res.write(fs.readFileSync(fileName));
		console.log('----------END----------');
		res.end();
	}
).listen(443);

