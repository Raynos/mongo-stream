var ReadStream = require("read-stream")
    , WriteStream = require("write-stream")
    , ReadWriteStream = require("read-write-stream")
    , map = require("mapping-stream")
    , fromSource = require("from-source")

    , mapMethods = ["insert", "remove", "save"]
    , sourceMethods = ["count", "findOne"]

module.exports = MongoStream

function MongoStream(collection) {
    var mongoStream = {}

    mapMethods.forEach(createMapFunction)

    mongoStream.update = update

    sourceMethods.forEach(createSourceFunction)

    mongoStream.findAndModify = findAndModify
    mongoStream.findAndRemove = findAndRemove
    mongoStream.find = find
    mongoStream.mapReduce = mapReduce

    return mongoStream

    function createMapFunction(methodName) {
        mongoStream[methodName] = mapFunction

        function mapFunction(options) {
            return map(applyMethod)

            function applyMethod(data, callback) {
                collection[methodName](data, options || {}, callback)
            }
        }
    }

    function createSourceFunction(methodName) {
        mongoStream[methodName] = sourceFunction

        function sourceFunction(selector, options) {
            return fromSource(applyMethod, { once: true })

            function applyMethod(callback) {
                collection[methodName](selector || {}, options || {}, callback)
            }
        }
    }

    function update(selector, options) {
        return map(applyMethod)

        function applyMethod(query, callback) {
            collection.update(selector || {}, query, options || {}, callback)
        }
    }

    function findAndModify(selector, sort, options) {
        return map(applyMethod)

        function applyMethod(query, callback) {
            collection.findAndModify(selector || {}, sort || [], query
                , options || {}, callback)
        }
    }

    function findAndRemove(sort, options) {
        return map(applyMethod)

        function applyMethod(selector, callback) {
            collection.findAndRemove(selector, sort || [], options || {}
                , callback)
        }
    }

    function find(selector, options) {
        var cursor = collection.find(selector || {}, options || {})

        return fromSource(getObject)

        function getObject(callback) {
            cursor.nextObject(callback)
        }
    }

    function mapReduce(map, reduce, options) {
        var queue = ReadStream()
            , stream = queue.stream

        collection.mapReduce(map, reduce, options || { out: "inline" }
            , streamResults)

        return stream

        function streamResults(err, collection, stats) {
            if (err) {
                return stream.emit("error", err)
            }

            if (stats) {
                stream.emit("stats", stats)
            }

            collection.find().each(pushItem)
        }

        function pushItem(err, item) {
            if (err) {
                return stream.emit("error", err)
            }

            queue.push(item)
        }
    }
}
