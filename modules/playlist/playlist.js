const {command} = require('../../commands/command');
const commandmanagerclass = require('../../commands/command_manager');
const {dcmodule} = require('../module')
const mysql = require('mysql');
const fs = require("fs")
const {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;

const Discord = require('discord.js');
const client = new Discord.Client();

class playlist extends dcmodule {
    constructor(){
        super();
        commandmanagerclass.registerCommand(new playlistadd());
        this.main();
    }

    async main() {
        this.initDatabase();
        var working = false
        setInterval(async () => {
            if(!working){
                working = true;
                var p = await this.getPlaylistDB();
                await asyncForEach(p, async (singleplaylist) => {
                    var files = await this.getFiles(singleplaylist.playlist);
                    var videos = await this.getVideos(singleplaylist.playlist);
                    var ids = [];
                    videos.forEach((singlevideo) => {
                        ids.push(singlevideo.VideoID)
                    })
                    asyncForEach(files, async (singlefile,index) => {
                        if(ids.includes(singlefile.snippet.resourceId.videoId)){
                            if(singlefile.snippet.title.toLowerCase() == 'deleted video' || singlefile.snippet.title.toLowerCase() == 'private video') {await this.deleted(singlefile.snippet.resourceId.videoId, singleplaylist.playlist, singleplaylist.Owner);}
                        }else if(singlefile.snippet.title.toLowerCase() !== "deleted video"){
                            await this.addVideo(singleplaylist.playlist, singlefile.snippet.title, singlefile.snippet.resourceId.videoId)
                        }
                    })
                })
                working = false;
            }
        }, 86400000);
    }

    authorize() {
        var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
            process.env.USERPROFILE) + '/.credentials/';
        var TOKEN_PATH = TOKEN_DIR + 'youtube-nodejs-quickstart.json';
        var credentials = require('./client_secret.json')
        var clientSecret = credentials.installed.client_secret;
        var clientId = credentials.installed.client_id;
        var redirectUrl = credentials.installed.redirect_uris[0];
        var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
      
        fs.readFile(TOKEN_PATH, function(err, token) {
          if (err) {
              console.log("Error at reading token");
              process.exit(1);
          } else {
            oauth2Client.credentials = JSON.parse(token);
            return oauth2Client;
          }
        });
    }

    async initDatabase(){
        return new Promise((resolve, reject) => {
            var tables = [
                "CREATE TABLE IF NOT EXISTS `playlist` ( `ID` TEXT(65535) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci', `playlist` TEXT(65535) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci', `Owner` MEDIUMTEXT NOT NULL COLLATE 'utf8mb4_general_ci', PRIMARY KEY (`ID`) USING BTREE ) COLLATE='utf8mb4_general_ci' ´ENGINE=InnoDB;",
                "CREATE TABLE IF NOT EXISTS `Videos` ( `Playlist` INT(11) NULL DEFAULT NULL, `videoname` TEXT(65535) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci', `VideoID` TEXT(65535) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci', `removed` TINYINT(4) NULL DEFAULT NULL ) COLLATE='utf8mb4_general_ci' ENGINE=InnoDB;"
            ];
            var config = require('./config.json');
            var connection = mysql.createConnection({
                host     : config.database.host,
                user     : config.database.user,
                password : config.database.password,
                database : config.database.database
            });
            connection.connect();
            tables.forEach((table, index) => {
                connection.query(table, (err, results, fields) => {
                    if(err) console.log(err)
                    if(index == tables.length - 1) {connection.destroy();resolve(true)}
                })
            })
        })
    }

    getPlaylist(ID, pageToken){
        return new Promise((resolve, reject) => {
            var config = require("./config.json")
            var service = google.youtube("v3");
            var auth = this.authorize();
            service.playlistItems.list({
                key: config.token,
                part: 'id,snippet,status',
                auth: auth,
                playlistId: ID,
                maxResults: 50,
                pageToken: pageToken
            }, (err, res) => {
                if(err) resolve({nextPageToken: null, items: []});
                if(res == undefined) resolve({nextPageToken: null})
                if(res !== undefined) resolve(res.data);
            })
        })
    }

    getFiles(ID){
        return new Promise(async (resolve, reject) => {
            var files = [];
            var playlist = await this.getPlaylist(ID);
            playlist.items.forEach((item) => {files.push(item)})
            while(playlist.nextPageToken !== undefined && playlist.nextPageToken !== null){
                playlist = await this.getPlaylist(ID, playlist.nextPageToken);
                playlist.items.forEach((item) => {files.push(item)})
            }
            resolve(files)
        })
    }

    addVideo(playlist, videoname, videoid){
        return new Promise(async (resolve, reject) => {
            var temp = await this.getVideo(videoid, playlist)
            if(temp == null && temp == null){
            var config = require('./config.json');
            var connection = mysql.createConnection({
                host     : config.database.host,
                user     : config.database.user,
                password : config.database.password,
                database : config.database.database
            });
            connection.connect();
            videoname = videoname.replace("\'", "");
            videoname = videoname.replace("\"", "");
            connection.query(`INSERT INTO Videos (Playlist, videoname, VideoID, removed) VALUES ('${playlist}', '${videoname}', '${videoid}', '0')`, (err, res, fields) => {
                if(err) reject(err)
                resolve(true);
                connection.destroy();
            })
        }else{
            resolve(false)
        }
        })
    }

    getVideo(videoid, playlist){
        return new Promise((resolve, reject) => {
            var config = require('./config.json');
            var connection = mysql.createConnection({
                host     : config.database.host,
                user     : config.database.user,
                password : config.database.password,
                database : config.database.database
            });
            connection.connect();
            connection.query(`SELECT * FROM Videos WHERE VideoID = '${videoid}' AND Playlist = '${playlist}'`, (err, res, fields) => {
                if(err) reject(err);
                resolve(res[0]);
                connection.destroy();
            });
        })
    }

    getPlaylistDB(){
        return new Promise((resolve, reject) => {
            var config = require('./config.json');
            var connection = mysql.createConnection({
                host     : config.database.host,
                user     : config.database.user,
                password : config.database.password,
                database : config.database.database
            });
            connection.connect();
            connection.query(`SELECT * FROM playlist`, (err, res, fields) => {
                if(err) reject(err);
                resolve(res);
                connection.destroy();
            })
        })
    }

    getVideos(playlist){
        return new Promise((resolve, reject) => {
            var config = require('./config.json');
            var connection = mysql.createConnection({
                host     : config.database.host,
                user     : config.database.user,
                password : config.database.password,
                database : config.database.database
            });
            connection.connect();
            connection.query(`SELECT * FROM Videos WHERE Playlist = '${playlist}'`, (err, res, fields) => {
                if(err) reject(err);
                resolve(res);
                connection.destroy();
            })
        })
    }

    deleted(videoid, playlist, owner){
        return new Promise(async (resolve, reject) => {
            var config = require('./config.json');
            var video = await this.getVideo(videoid, playlist);
            if(video.removed == 0){
                var connection = mysql.createConnection({
                    host     : config.database.host,
                    user     : config.database.user,
                    password : config.database.password,
                    database : config.database.database
                });
                connection.connect();
                connection.query(`UPDATE Videos SET removed = 1 WHERE VideoID = '${videoid}' AND Playlist = '${playlist}'`, (err, res, fields) => {
                    connection.destroy();
                    client.users.fetch(owner, false).then((user) => {
                        user.send(`Das Video "${video.videoname}" aus der Playlist https://www.youtube.com/playlist?list=${playlist} wurde entfernt`);
                        resolve(true)
                    });
                })
            }else{
                resolve(false)
            }
        })
    }


}

class playlistadd extends command {
    constructor() {
        super('playlist', 'Überwachung deiner YouTube Playlist', 'Misc', (args, message) => {
            
        })
    }
}

function addPlaylist(playlist, owner){
    return new Promise((resolve, reject) => {
        var config = require('./config.json');
        var connection = mysql.createConnection({
            host     : config.database.host,
            user     : config.database.user,
            password : config.database.password,
            database : config.database.database
        });
        connection.connect();
        connection.query(`INSERT INTO playlist (playlist, Owner) VALUES ('${playlist}', '${owner}')`, (err, results, fields) => {
            if(err) reject(err);
            resolve(true);
            connection.destroy();
        })
    })
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
    }
}

exports.playlist = playlist;