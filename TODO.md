# Left to do

- Filter out places that are no longer "open"
- A handful of places have fewer reviews than the total (typically ones with a lot of reviews). For example placeId e8857626-9830-4211-92a6-391c52b45ae0 seems to be stuck on 920 reviews but should be getting 1024 reviews
- The sorting can get a bit funky in the table
- Hard code list of chains like McDonald's, Subway, etc. and ignore those. Not worth the effort of figuring out which to ignore programmatically.
- The audit fields might be overkill. Think about removing or flattening those.
