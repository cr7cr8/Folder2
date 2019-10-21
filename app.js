
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");

//const Grid = require("gridfs-stream");
//const methodOverride = require("method-override");
const fs = require("fs");



console.log(`Time is ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`);
const app = express();
app.use(bodyParser.json());
//app.use(methodOverride('_method'));

app.set("view engine", "ejs");




app.use(express.static("./uploads"));
app.use(express.static("./views"));





const mongoURI = 'mongodb+srv://boss:ABCabc123@cluster0-iiqnu.azure.mongodb.net/DB3?retryWrites=true&w=majority';



const conn = mongoose.createConnection(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });



conn.once("open", function () {
    console.log(`${conn.db.databaseName} open`);
    mongoose.connection = conn;
    mongoose.connections.push(conn);
    new mongoose.mongo.Admin(conn.db).listDatabases(function (err, result) {
        console.log('listDatabases succeeded');
        // database list stored in result.databases
        var allDatabases = result.databases;
        allDatabases.forEach(element => {
            console.log(element);
        });

    });

}).then(function () {
    //console.log(mongoose.connections[0]);

    //   var collname = conn.db.collection("uploads.files").insertOne({ item: "journal"});


    app.use(function (req, res, next) {
        console.log("some one is in ===================" + new Date().toTimeString().substr(0, 8));
        next();
    })

    //app.get("/", function (req, res, next) { res.render("index"); console.log("---- showing getting page ----");/*next()*/ }, function (req, res, next) { console.log(222) });
    app.get("/", function (req, res, next) { 
        
        res.render("index",{src:"/"}); console.log("---- showing getting page ----")
        
    })

    const mongoDB_storage = new GridFsStorage({
        //url: mongoURI,
        //options:{ useNewUrlParser: true, useUnifiedTopology: true },

        db: conn.db,
        file: (req, file) => {
            console.log("------- mongoDB_storage start-------");
            return new Promise((resolve, reject) => {
                crypto.randomBytes(16, (err, buf) => {
                    if (err) { return reject(err); }


                    const filename = path.basename(file.originalname).replace(path.extname(file.originalname), "") + "_" + buf.toString('hex').substr(0, 3) + path.extname(file.originalname);
                    const fileInfo = {
                        filename: filename,
                        bucketName: 'uploads' //match the collection name
                    };
                    resolve(fileInfo);
                });
            });
        }
    });
    const mongoDB_upload = multer({ storage: mongoDB_storage });

    const disk_storage = multer.diskStorage({

        destination: function (req, file, cb) { cb(null, 'uploads/') },
        filename: function (req, file, cb) { cb(null, file.fieldname + '-' + Date.now() + ".jpg") }

    });
    const localFolder_upload = multer({ storage: disk_storage });

    const myOwn_storage = (function () {

        return {
            _handleFile: function (req, file, cb) {
                var outStream = require('fs').createWriteStream('uploads/' + file.originalname);

                file.stream.pipe(outStream);
                outStream.on("finish",
                    function () {
                        cb(null, { path: path, size: outStream.bytesWritten });
                        console.log(outStream.bytesWritten);
                    }

                );
            },
            _removeFile: function (req, file, cb) {
                fs.unlink(file.path, cb)
            }
        }
    })();
    const myOwn_upload = multer({ storage: myOwn_storage });

    const myCustomStorage = require("./myStorageEngine")({
        destination: function (req, file, cb) { cb(null, 'uploads/' + file.originalname) }
    });
    const myCustomStorage_upload = multer({ storage: myCustomStorage });






    app.post("/upload", mongoDB_upload.single("file"), function (req, res) {
        //     app.post("/upload", localFolder_upload.single("file"), function (req, res) {
        //app.post("/upload", myOwn_upload.single("file"), function (req, res) {
        //app.post("/upload", myCustomStorage_upload.single("file"), function (req, res) {



        console.log("------- mongoDB_storage Done -------");


        console.log(req.file.originalname)
        console.log(req.file.filename)



        //  const torf = ([".jpg", ".png", ".gif"].indexOf(path.extname(req.file.originalname).toLowerCase()) > -1) ?
        //      res.redirect("/image/"+ req.file.filename) : res.send("/"+req.file.filename);


        // const torf = ([".jpg", ".png", ".gif", ".mp3"].indexOf(path.extname(req.file.originalname).toLowerCase()) > -1) ?
        //    res.send("/files/" + req.file.filename) : res.send("/files/" + req.file.filename);

        res.send("/files/" + req.file.filename);

    })




    app.get("/image/:filename", function (req, res) {


        let imgws = fs.createWriteStream("./uploads/" + req.params.filename);
        console.log("------fetching image from MongoDB to server disk----");

        var gfs = new mongoose.mongo.GridFSBucket(conn.db, {
            chunkSizeBytes: 255 * 1024,
            bucketName: "uploads"
        });
        gfs.openDownloadStreamByName(req.params.filename).pipe(imgws);

        imgws.on("finish", function () {
            res.send("/" + req.params.filename);
            console.log("------fetching image to server is done----");
        })

    })


    app.get("/files/:filename", function (req, res) {

        console.log(`---- fetching ${req.params.filename} from MongoDB ---- ${(new Date().toTimeString()).substr(0, 8)}`);





        var gfs = new mongoose.mongo.GridFSBucket(conn.db, {
            chunkSizeBytes: 255 * 1024,
            bucketName: "uploads"
        });



        // gfs.find({ filename: req.params.filename }).toArray((err,doc)=>{

        //     gfs.openDownloadStreamByName(doc.filename).pipe(res);

        // });
        gfs.find({ filename: req.params.filename }, { limit: 1 }).forEach(function (doc) {
            console.log("processing find")


            var gfsrs = gfs.openDownloadStreamByName(doc.filename);


            gfsrs.on("data", function (data) {

                console.log(data);
                res.write(data);


            })
            gfsrs.on("close", function () {
                res.end();
                console.log(`------fetching ${req.params.filename} Done !----`);
            })



        });



        // gfs.openDownloadStreamByName(req.params.filename).pipe(res);






    })


    /*
            gfs.files.findOne({ filename: req.params.filename }, function (err, file) {
     
                if (!file || file.length === 0) {
                    return res.status(404).json({
                        err: "No files exist"
                    });
                }
                return res.json(file);
            })
    */




    app.listen(80);
});


