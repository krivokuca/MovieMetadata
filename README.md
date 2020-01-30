# MovieMetadata
This is a Javascript class that can search for movie metadata (which it scrapes from IMDb) along with torrent data. 

## Usage
Simply download the JS file and include it in your project. 

```javascript
const Metadata = require('./MovieMetadata.js');
let crawler = new Metadata("Austin Powers");

// get the movie data
crawler.getIMDBData(movieData =>{
  // get the torrent data
  crawler.getTorrents(false, torrentData=>{
    return([movieData, torrentData])
  })
})
```

The code above will return the following:
```json
[
    {
        "imdbId": "tt0118655",
        "type": "movie",
        "name": "Austin Powers: International Man of Mystery(1997)",
        "summary": "A 1960s secret agent is brought out of cryofreeze to oppose his greatest enemy in the 1990s, where his social attitudes are glaringly out of place.",
        "rating": 7,
        "storyline": "Austin Powers is a 60's spy who is cryonically frozen and released in the 1990's. The world is a very different place for Powers. Unfortunately for Austin, everyone is no longer sex-mad. Although he may be in a different decade, his mission is still the same. He has teamed up with Vanessa Kensington to stop the evil Dr. Evil, who was also frozen in the past. Dr. Evil stole a nuclear weapon and is demanding a payment of (when he realises its the 90's) 100 billion dollars. Can Austin Powers stop this madman? or will he caught up with Evil's henchman, with names like Alotta Fagina and Random Task? Only time will tell!",
        "cast": [
            {
                "Mike Myers": "Austin Powers / Dr. Evil"
            },
            {
                "Elizabeth Hurley": "Vanessa Kensington"
            },
            {
                "Michael York": "Basil Exposition"
            },
            {
                "Mimi Rogers": "Mrs. Kensington"
            },
            {
                "Robert Wagner": "Number Two"
            },
            {
                "Seth Green": "Scott Evil"
            },
            {
                "Fabiana Udenio": "Alotta Fagina"
            },
            {
                "Mindy Sterling": "Frau Farbissina"
            },
            {
                "Paul Dillon": "Patty O\\'Brien"
            },
            {
                "Charles Napier": "Commander Gilmour"
            },
            {
                "Will Ferrell": "Mustafa"
            },
            {
                "Joann Richter": "60s Model"
            },
            {
                "Anastasia Sakelaris": "60s Model (as Anastasia Nicole Sakelaris)"
            },
            {
                "Afifi Alaouie": "60s Model"
            },
            {
                "Monet Mazur": "Mod Girl"
            }
        ],
        "posterURL": "https://m.media-amazon.com/images/M/MV5BMTRhZTY0MDItY2I1Yi00MGE3LTk1ZDEtMjA0ZGZhNDQyNGU0XkEyXkFqcGdeQXVyNTIzOTk5ODM@._V1_.jpg",
        "runtime": "1h34min"
    },
    [
        {
            "title": "Austin Powers 1-3 Trilogy 1997-2002 BluRay 720p x264 ac3 jbr p",
            "magnetLink": "magnet:?xt=urn:btih:8a08952ddcd27d59646b0d80628ecd55c844ed24&dn=Austin+Powers+1-3+Trilogy+1997-2002+BluRay+720p+x264+ac3+jbr+p&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Ftracker.publicbt.com%3A80&tr=udp%3A%2F%2Ftracker.ccc.de%3A80",
            "seeders": "39",
            "leechers": "14"
        } ...
     ]
]
```

This class can also list a tv shows episodes from any given season:
```javascript
crawler.listEpisodes('tt0098904',1).then(episodes=>{
  return(episodes)
})
```
