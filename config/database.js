const mongoClient = require('mongodb').MongoClient

const state = {
    db: null
}

module.exports.connect = (done) => {
    const url = process.env.MONGO_URL
    const dbName = "Heiler"

    mongoClient.connect(url, (err, data) => {
        if (err) {
            return done(err)
        }

        state.db = data.db(dbName);
        done()
    })
}

module.exports.get = () => {
    return state.db
}