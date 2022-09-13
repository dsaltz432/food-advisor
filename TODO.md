# Left to do

- A handful of places have fewer reviews than the total (typically ones with a lot of reviews). For example placeId e8857626-9830-4211-92a6-391c52b45ae0 seems to be stuck on 920 reviews but should be getting 1024 reviews
- The sorting can get a bit funky in the table
- Scrape points and level even if there are no reviews
- Unable to parse some places, even though the Maps have reviews ("Unable to find total_expected_number_of_reviews. Assuming 0 reviews.")
- Validate input args lat/lng/radius/keyword

- Figure out why this is needed = const skipAuthorIds = ['bad07004-faa8-4629-b7f2-9cde8fc10eb6'];
- Update placeReviews with authorId once we're marking an author as "scraped", within the actual flow of scraping
- Some addresses are empty and just end up with the string of "-". Maybe handle this better?
- Figure out why I'm unable to filter out authors that already have locationStats

- I think there are duplicate reviews between the place reviews and the author reviews
  Example here: db.reviews.find({authorId:'4b7a07d6-9dc8-4f1d-abb5-f00da7d402f2',text:/Malaysian born & raised here, ordered roti canai/}).pretty()

- Analyze places feedback: https://docs.google.com/spreadsheets/d/1ZOs0PgV64Xc1vaJ90IwDkOyT6jUReVThQYy1f63rTeM/edit#gid=0

- Should I only analyze reviews made prior to each place review? Right now if someone reviews something in Brooklyn, but has never been to brooklyn, and then 2 years later moves to Brooklyn and reviews a lot of places there, it would treat the first review as "local"

## Location Mapping

// Find mappings for these locations. Might be invalid zip codes
// Unable to find location for author review. address [36 AZ-179 Suite B201, Sedona, AZ 86636]. reviewId: 7dbf02b0-77e0-474b-8659-82d733df0b1a
// Unable to find location for author review. address [2420 Wisteria Dr SW, Snellville, GA 30278]. reviewId: 6f09f9d4-8147-4b32-ac63-f721fff530f7
// 'Newark Liberty International Airport, Newark, NJ 07714'
// Unable to find location for author review. address [302 Ubi Ave 1, #01-35, Greenville 400302]. reviewId: ba1c187f-7560-4825-82cd-a6956f225e66
// '315 Broadway, Millbrae, CA 94032'
// Unable to find location for author review. address [Bldg 5280 Pendleton Ave MS 46, Joint Base Lewis-McChord, WA 984331672]. reviewId: 092123dc-515b-4c67-80f8-a866ec27f8f8
// Unable to find location for author review. address [914 Airport Center Rd, Allentown, PA 18107]. reviewId: 98bbe67b-b6e4-4331-96c6-60466d278b97
// Unable to find location for author review. address [13803 Motley Rd, Bentonville, AR 72713]. reviewId: 925d3a7c-177f-4891-bd16-d24bc33f501a
