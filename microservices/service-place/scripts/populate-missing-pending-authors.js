
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const generateNewAuthorStub = (review) => {
  return {
    _id: uuidv4(),
    googleAuthorId: review.authorUrl.split('https://www.google.com/maps/contrib/')[1].split('/')[0],
    authorName: review.authorName,
    authorUrl: review.authorUrl,
    authorIsLocalGuide: review.authorIsLocalGuide,
    authorNumReviews: review.authorNumReviews,
    authorLevel: null,
    authorPoints: null,
    totalReviews: null,
    totalRatings: null,
    status: 'pending',
    audit: {
      createdDate: new Date(),
      updatedDate: null,
    },
  };
};

// Find reviews with no author in the DB
var missingGoogleAuthorIds = [];
var analyzedReviewCount = 0;
var googleAuthorIdBatch = [];
db.reviews.find({source:'placeScraper'}).forEach(review => {
	const googleAuthorId = review.googleAuthorId;
	if (googleAuthorId) {
        googleAuthorIdBatch.push(googleAuthorId);
        if (googleAuthorIdBatch.length > 1000) {
            const authors = db.authors.find({googleAuthorId:{$in:googleAuthorIdBatch}}).toArray();
            var authorsMap = {};
            for (const author of authors) {
                authorsMap[author.googleAuthorId] = author;
            }
            for (const googleAuthorIdInner of googleAuthorIdBatch) {
                const author = authorsMap[googleAuthorIdInner];
                if (!author && !missingGoogleAuthorIds.includes(googleAuthorIdInner)) {
                    missingGoogleAuthorIds.push(googleAuthorIdInner);
                }
            }
            googleAuthorIdBatch = [];
        }
	}
	analyzedReviewCount++;
	if (analyzedReviewCount % 500 === 0 && analyzedReviewCount > 0) {
		print(`Analyzed ${analyzedReviewCount} reviews. Found ${missingGoogleAuthorIds.length} missingGoogleAuthorIds`);
	}
});
if (googleAuthorIdBatch.length) {
    const authors = db.authors.find({googleAuthorId:{$in:googleAuthorIdBatch}}).toArray();
    var authorsMap = {};
    for (const author of authors) {
        authorsMap[author.googleAuthorId] = author;
    }
    for (const googleAuthorIdInner of googleAuthorIdBatch) {
        const author = authorsMap[googleAuthorIdInner];
        if (!author && !missingGoogleAuthorIds.includes(googleAuthorIdInner)) {
            missingGoogleAuthorIds.push(googleAuthorIdInner);
        }
    }
    googleAuthorIdBatch = [];
}

// Sanity check these are really messing - expect 0 count
db.authors.find({googleAuthorId:{$in: missingGoogleAuthorIds}}).count();


// Create the pending authors for these missing googleAuthorIds
var totalAuthorStubsCreated = 0;
var googleAuthorIdsForStubsBatch = [];
for (const googleAuthorId of missingGoogleAuthorIds) {
    googleAuthorIdsForStubsBatch.push(googleAuthorId);
    if (googleAuthorIdsForStubsBatch.length > 500) {
        // find any review for this author to get the data we need
        const reviews = db.reviews.find({ googleAuthorId: { $in: googleAuthorIdsForStubsBatch } }).toArray();
        const reviewPerGoogleAuthorIdMap = {};
        for (const review of reviews) {
            reviewPerGoogleAuthorIdMap[review.googleAuthorId] = review;
        }
        const authorStubs = [];
        for (const googleAuthorIdInner of googleAuthorIdsForStubsBatch) {
            const review = reviewPerGoogleAuthorIdMap[googleAuthorIdInner];
            authorStubs.push(generateNewAuthorStub(review));
        }
        db.authors.insertMany(authorStubs);
        totalAuthorStubsCreated += googleAuthorIdsForStubsBatch.length;
        googleAuthorIdsForStubsBatch = [];
        print(`Created ${totalAuthorStubsCreated} author stubs`);
    }
}
if (googleAuthorIdsForStubsBatch.length) {
    // find any review for this author to get the data we need
    const reviews = db.reviews.find({ googleAuthorId: { $in: googleAuthorIdsForStubsBatch } }).toArray();
    const reviewPerGoogleAuthorIdMap = {};
    for (const review of reviews) {
        reviewPerGoogleAuthorIdMap[review.googleAuthorId] = review;
    }
    const authorStubs = [];
    for (const googleAuthorIdInner of googleAuthorIdsForStubsBatch) {
        const review = reviewPerGoogleAuthorIdMap[googleAuthorIdInner];
        authorStubs.push(generateNewAuthorStub(review));
    }
    db.authors.insertMany(authorStubs);
    totalAuthorStubsCreated += googleAuthorIdsForStubsBatch.length;
    googleAuthorIdsForStubsBatch = [];
    print(`Created ${totalAuthorStubsCreated} author stubs. Finished.`);
}
