const fs = require('fs');
var CronJob = require('cron').CronJob;
var bitCanna = require('node-bitcoin-rpc');
const nodemailer = require("nodemailer");

// Config
var nomicsApiKey = '*********'; // nomics.com api key
var gmailUser = '*********'; // Before @gmail.com
var gmailPass = '*********'; // Gmail password

// async..await is not allowed in global scope, must use a wrapper
async function main(balance,oldAmount,diff,BCNAResponse) {
	let transporter = nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 465,
		secure: true, // true for 465, false for other ports
		auth: {
			user: gmailUser, 
			pass: gmailPass, 
		},
	});


	// send mail with defined transport object
	let info = await transporter.sendMail({
		from: '"MyBitCannaBot" <no-reply@abuse.com>', // sender address
		to: "contact.atmoner@gmail.com", // list of receivers
		subject: "Bitcanna report daily", // Subject line
		text: "Bitcanna report daily", // plain text body
		html: "<header role='banner'>"+
			"<p><img src='https://www.bitcanna.io/storage/2018/04/BitCanna-logo-main.png' width='100' height='100'></p>"+
			"<p>Here you will find all the latest information about your Bitcanna wallet</p>"+
			"<div>"+
			"BCNA staked today: <b>"+(balance - oldAmount)+" BCNA (<font color='green'>+"+diff.toFixed(4)+"%)</font></b><br />"+ 
			"Euro won today: <b>"+((balance - oldAmount) * BCNAResponse[0].price)+" € </font></b><br />"+ 
			"Wallet amount today: <b>"+balance+" BCNA </b><br />"+ 
			"Wallet amount yesterday: <b>"+oldAmount+" BCNA</b><br />"+ 
			"<br />"+ 
			"BCNA value today: <b>"+BCNAResponse[0].price+" €</b><br />"+ 
			"Last 24h statistics: <br />"+ 
			"&emsp; Volume: <b>"+BCNAResponse[0]['1d'].volume+" BCNA</b><br />"+ 
			"&emsp; Price change: <b>"+BCNAResponse[0]['1d'].price_change+" €</b><br />"+ 
			"&emsp; Price change pct: <b>"+BCNAResponse[0]['1d'].price_change_pct+" %</b><br />"+ 
			"&emsp; Volume change: <b>"+BCNAResponse[0]['1d'].volume_change+" BCNA</b><br />"+ 
			"&emsp; Volume change pct: <b>"+BCNAResponse[0]['1d'].volume_change_pct+" %</b><br />"+ 
			"</div>"+
		"</header>",

	});

	console.log("Message sent: %s", info.messageId);
	// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
}

// Cron
const job = new CronJob('0 */1 * * * *', function() {
	const d = new Date();
	console.log('Every second:', d);

	let rawdata = fs.readFileSync('config.json');
	let authentification = JSON.parse(rawdata);

	// Init bitcanna
	bitCanna.init(authentification.rpcHost, authentification.rpcPort, authentification.rpcUser, authentification.rpcPass)

	bitCanna.call('getinfo', [], function (err, resB) {
		if (err !== null) {
			console.log('I have an error :( ' + err )
		} else {
			fs.readFile('data.json', 'utf8', function (err,data) {
				if (err) {
					return console.log(err);
				}
				const obj = JSON.parse(data);
				console.log(obj.oldAmount);
				
				const request = require('request')
				,url = 'https://api.nomics.com/v1/currencies/ticker?key='+nomicsApiKey+'&ids=BCNA&interval=1d,30d&convert=EUR&page=1'
				
				request(url, (error, response, body)=> {
					if (!error ) {
						const BCNAResponse = JSON.parse(body)
						console.log(BCNAResponse)
						
						var diff = (resB.result.balance-obj.oldAmount)/resB.result.balance
						main(resB.result.balance,obj.oldAmount,diff,BCNAResponse).catch(console.error);
						
					} else {
						console.log("Got an error: ", error, ", status code: ", response.statusCode)
					}
				})	
			});			
		}
	})
});

job.start();
 
/*
 * var bitCanna = require('node-bitcoin-rpc');

let rawdata = fs.readFileSync('config.json');
let authentification = JSON.parse(rawdata);

// Init bitcanna
bitCanna.init(authentification.rpcHost, authentification.rpcPort, authentification.rpcUser, authentification.rpcPass)

bitCanna.call('getinfo', [], function (err, resB) {
	if (err !== null) {
		console.log('I have an error :( ' + err )
	} else {
		res.send(resB.result)
	}
})
*/
