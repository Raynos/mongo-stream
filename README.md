# mongo-stream

Streaming interface to mongo

## Example

``` js
var collection = require("mongo-col")
    , from = require("read-stream").fromArray
    , to = require("write-stream").toArray
    , MongoStream = require("mongo-stream")

    , someCollection = collection("name")
    , someCollectionStream = MongoStream(someCollection)
    , data = [{
        some: "data"
    }]

from(data)
    .pipe(someCollectionStream.insert({ safe: true }))
    .pipe(to([], function readList(list) {
        console.log("inserted correctly", list)

        someCollectionStream.find({ hello: "world" })
            .pipe(to([], function readResult(list2) {
                console.log("found correctly", list2)
            }))
    }))
```

## Installation

`npm install mongo-stream`

## Contributors

 - Raynos

## MIT Licenced
