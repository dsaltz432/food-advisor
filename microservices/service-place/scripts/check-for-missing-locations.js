

var authors = db.authors.find({ status: 'scraped' }).toArray();
const authorIds = authors.map(a => a._id);

db.reviews.find({source:'placeScraper',authorId:{$in:authorIds},location:{$exists:false}}).count();
db.reviews.find({source:'authorScraper',authorId:{$in:authorIds},location:{$exists:false}}).count();


db.reviews.find({source:'placeScraper',authorId:{$in:authorIds},location:{$exists:true}}).count();
db.reviews.find({source:'authorScraper',authorId:{$in:authorIds},location:{$exists:true}}).count();


// find all of the authorIds who have any review that is missing
var authorIdsWithMissingReviewLocation = db.reviews.distinct('authorId', { authorId: { $in: authorIds }, location: { $exists: false } });

// clear location from all of these author's reviews
db.reviews.find({authorId:{$in:authorIdsWithMissingReviewLocation},location:{$exists:true}}).count()
//db.reviews.updateMany({authorId:{$in:authorIdsWithMissingReviewLocation},location:{$exists:true}},{$unset:{location:1}})



