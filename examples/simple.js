var collection = require("mongo-col")
    , TempData = collection("temp-data")
    , to = require("write-stream").toArray
    , from = require("read-stream").fromArray
    , assert = require("assert")
    , map = require("mapping-stream")

    , MongoStream = require("../index")

    , data = [{
            hello: "world"
        }
        , {
            other: "data"
        }]

TempData.drop(function (err) {
    if (err) {
        throw err
    }

    TempData = MongoStream(TempData)

    testInsertAndFind()
})

function testInsertAndFind() {
    from(data)
        .pipe(TempData.insert({ safe: true }))
        .pipe(to([], function readList(list) {
            console.log("inserted correctly", list)

            var findStream = TempData.find({ hello: "world" })

            findStream.pipe(to([], function readResult(list2) {
                console.log("found correctly", list2)
                assert.equal(list2[0].hello, "world")

                testRemoveAndSave()
            }))
        }))
}

function testRemoveAndSave() {
    from([{ hello: "world" }])
        .pipe(TempData.remove({ save: true }))
        .pipe(map(function (item) {
            console.log("removed correctly", item)
            assert.equal(item, 1)
            return { hello: "world" }
        }))
        .pipe(TempData.save({ safe: true}))
        .pipe(to([], function (results) {
            console.log("saved correctly", results)
            assert.equal(results[0].hello, "world")

            testCountAndFindOne()
        }))
}

function testCountAndFindOne() {
    TempData.count()
        .pipe(to([], function (list) {
            console.log("count result", list)
            assert.equal(2, list[0])

            TempData.findOne({ hello: "world"})
                .pipe(to([], function (list) {
                    console.log("findOne result", list)
                    assert.equal(list[0].hello, "world")

                    testUpdateAndFindAndX()
                }))
        }))
}

function testUpdateAndFindAndX() {
    from([{ $set: { foo: "bar" } }])
        .pipe(TempData.update({ hello: "world" }, { safe: true }))
        .pipe(map(function (item) {
            console.log("update result", item)
            assert.equal(item, 1)
            return { $set: { foo2: "bar2" } }
        }))
        .pipe(TempData.findAndModify({ hello: "world" }, [], {
            safe: true
            , upsert: true
            , new: true
        }))
        .pipe(map(function (result) {
            console.log("findAndModify result", result)
            assert.equal(result.foo2, "bar2")
            return { hello: "world" }
        }))
        .pipe(TempData.findAndRemove([], { safe: true }))
        .pipe(map(function (result) {
            console.log("findAndRemove result", result)
            assert.equal(result.foo, "bar")

            testMapReduce()
        }))
}

function testMapReduce() {
    TempData.mapReduce(function map() {
        emit(this.other, 1)
    }, function reduce(k, vals) {
        return 1
    }).pipe(to([], function (list) {
        console.log("mapReduce result", list)
        assert.equal(list[0]._id, "data")
        assert.equal(list[0].value, 1)

        finish()
    }))
}

function finish() {
    process.exit(0)
}
