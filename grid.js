const methodOverride = require('method-override');
const multer = require('multer')
const path = require('path')
const crypto = require('crypto')
const mongoose = require('mongoose')
const fs = require('fs')
const { GridFsStorage } = require('multer-gridfs-storage');


const conn = mongoose.createConnection('mongodb://127.0.0.1:27017/brainboost')

const db = mongoose.connection

var storage = new GridFsStorage({
    url: 'mongodb://127.0.0.1:27017/brainboost',
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'user'
                };
                resolve(fileInfo);
            });
        });
    }
});
var coursesStorage = new GridFsStorage({
    url: 'mongodb://127.0.0.1:27017/brainboost',
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'courses'
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({ storage });
const coursesUpload = multer({ storage:coursesStorage  })
module.exports = { upload, coursesUpload }