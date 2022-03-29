const config = config.json

const StreamArray = require( 'stream-json/streamers/StreamArray');
const Destiny2API = require('node-destiny-2');
const fetch = require('sync-fetch');
const ObjectsToCsv = require('objects-to-csv');

const fs = require('fs');

const jsonStream = StreamArray.withParser();
const destiny = new Destiny2API({
  config.apiKey
});

let itemManifest = {};
destiny.getManifest()
	.then(res => {
		itemManifest = fetch("https://www.bungie.net" + res.Response.jsonWorldComponentContentPaths.en.DestinyInventoryItemDefinition, {}).json();
		fs.createReadStream('./test.json').pipe(jsonStream.input)
	})
	.catch(err => console.log(`Error: ${err}`));


let output = [];

jsonStream.on('data', ({key, value}) => {
	value.entries.forEach (player => {
		try {
			let weaponArray = player.extended.weapons;
			
			weaponArray.map((element) => {
				let weapons = [];
				let obj = {};
				
				let weapon = element.referenceId;
				let weaponName = itemManifest[weapon].displayProperties.name;
				let kills = element.uniqueWeaponKills.basic.displayValue;
				
				let matchStatus = player.values.standing.basic.displayValue;
				weapons.push(weaponName);
					
				obj.weapons = weapons;
				obj.kills = kills;
				obj.matchStatus = matchStatus;
					
				output.push(obj);
			});
		} catch (err) {
			return; //skip, some people finish matches without a single weapon kill :skull:
		}			
	});
});

jsonStream.on('error', (err) => {
	console.log(err);
	console.log(output);
	try {
		const csv = new ObjectsToCsv(output);
		csv.toDisk('./test.csv');
		//fs.writeFileSync("output.json", JSON.stringify(output));
	} catch (error) {
		console.log(error)
	}
});

jsonStream.on('end', ({key, value}) => {
    console.log(output);
	try {
		const csv = new ObjectsToCsv(output);
		csv.toDisk('./test.csv');
		//fs.writeFileSync("output.json", JSON.stringify(output));
	} catch (err) {
		console.log(err)
	}
});