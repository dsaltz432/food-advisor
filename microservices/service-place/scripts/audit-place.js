// var googlePlaceId = 'ChIJPW1qMjv2wokR5At5Y4I__iI';
var googleAuthorIds = (db.reviews.find({placeId:'f2060823-20e5-4a25-9016-62adc5799d79'}).toArray()).map(r=>r.googleAuthorId);

db.authors.find({googleAuthorId:{$in:googleAuthorIds},status:'pending'}).count()
db.authors.find({googleAuthorId:{$in:googleAuthorIds},status:'scraped'}).count()


