"use strict";
/**
 * @class MovieMetadata
 * Fetches data for a search query including Movie/TV information, lists of episodes and torrents
 * @author Daniel Krivokuca
 * @version 1.0.0
 */
const request = require("request");
const cheerio = require("cheerio");
const PromisePool = require("es6-promise-pool");

request.defaults({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36"
  }
});

class MetaData {
  constructor(term) {
    this.searchTerm = term;
  }

  // Getter functions
  getTerm() {
    return this.searchTerm;
  }

  /**
   * Fetches movie and tv show data from IMDb and returns it to the user.
   * @param {function} callback
   * @returns {Object} An object consisting off all the metadata extracted from IMDb
   */
  getIMDBData(callback) {
    if (!this.searchTerm) {
      throw new Error("Search term is not defined");
    }
    var self = this;
    request(
      `https://www.imdb.com/find?ref_=nv_sr_fn&q=${encodeURIComponent(
        this.searchTerm
      )}&s=all`,
      function(error, response, body) {
        if (error) {
          throw new Error(error);
        }
        // load the DOM
        var $ = cheerio.load(body);

        // get the highest-most search result href attribute
        var next = $("tr.findResult > td.result_text > a").attr("href");
        if (next === undefined) {
          callback(false);
        } else {
          // send a request to the next URL
          request(`https://www.imdb.com${next}`, function(
            error,
            response,
            newbody
          ) {
            if (error) {
              throw new Error(error);
            }

            $ = cheerio.load(newbody);

            // media object to return data to
            var mediaObject = {};

            var subtext = $(".subtext")
              .text()
              .replace(/\s/g, "");
            mediaObject["imdbId"] = next.split("/")[2];
            mediaObject["type"] =
              subtext.includes("TVSeries") || subtext.includes("TVMini")
                ? "tv"
                : "movie";
            mediaObject["name"] = $(".title_wrapper > h1")
              .text()
              .replace(/\u00a0/g, "")
              .replace(/\@.*$/g, "")
              .trim();
            mediaObject["summary"] = self._mysql_real_escape_string(
              $(".summary_text")
                .text()
                .trim()
                .replace(/'/g, "\\'")
            );
            mediaObject["rating"] = parseFloat(
              $('span[itemprop="ratingValue"]').text()
            );

            mediaObject["storyline"] = $("#titleStoryLine > .inline")
              .eq(0)
              .find("span")
              .text()
              .trim();

            mediaObject["cast"] = [];
            $("table.cast_list > tbody")
              .children("tr")
              .each(function(i, elm) {
                if (i !== 0) {
                  let actor = self._mysql_real_escape_string(
                    $(this)
                      .find("td")
                      .eq(1)
                      .text()
                      .trim()
                  );

                  let character =
                    mediaObject["type"] === "movie"
                      ? self._mysql_real_escape_string(
                          $(this)
                            .find("td.character")
                            .text()
                            .trim()
                            .replace(/\n/g, "")
                        )
                      : self._mysql_real_escape_string(
                          $(this)
                            .find("td.character > a")
                            .eq(0)
                            .text()
                        );

                  if (character !== "") {
                    let returnObject = {};
                    returnObject[actor] = character;
                    mediaObject["cast"].push(returnObject);
                  }
                }
              });
            if (!$("div.poster > a > img").attr()) {
              callback(
                new Error(
                  `[MetaData] Error could not locate any media with searchterm ${this.searchTerm}`
                )
              );
            } else if (
              $("div.poster > a > img")
                .attr("src")
                .includes("@@")
            ) {
              mediaObject["posterURL"] = $("div.poster > a > img")
                .attr("src")
                .replace(/\@.*$/g, "@@._V1_.jpg");
            } else {
              mediaObject["posterURL"] = $("div.poster > a > img")
                .attr("src")
                .replace(/\@.*$/g, "@._V1_.jpg");
            }

            if (mediaObject["type"] == "tv") {
              // append a total number of seasons and total number of episodes
              mediaObject["totalSeasonCount"] = parseInt(
                $(".seasons-and-year-nav > div")
                  .eq(2)
                  .children("a")
                  .eq(0)
                  .text()
              );
              mediaObject["totalEpisodeCount"] = parseInt(
                $(".bp_description > span.bp_sub_heading")
                  .text()
                  .replace(/[^0-9]/g, "")
              );
            } else {
              // append a runtime count to the mediaObject
              mediaObject["runtime"] = subtext.split("|")[1];
            }

            callback(mediaObject);
          });
        }
      }
    );
  }

  /**
   * Returns an array of Episode Objects containing information about each episode
   * @param {String} imdbId The imdb ID of the tv show
   * @param {Integer} season The season to list the episodes from
   * @param {Function} callback
   */
  listEpisodes(imdbId, season) {
    var self = this;
    return new Promise((resolve, reject) => {
      request(
        `https://www.imdb.com/title/${imdbId}/episodes?season=${season}`,
        function(err, response, body) {
          if (err) {
            console.log(err);
          } else {
            var returnObj = [];
            var $ = cheerio.load(body);
            $(".list")
              .children(".list_item")
              .each(function(i) {
                var childObj = {};
                childObj["epName"] = $(this)
                  .find(".info > strong")
                  .text();
                childObj["epName"] = childObj["epName"].replace(/'/g, "");
                childObj["epNum"] = i + 1;
                childObj["airDate"] = $(this)
                  .find(".airdate")
                  .text()
                  .trim();
                childObj["rating"] = $(this)
                  .find("span.ipl-rating-star__rating")
                  .eq(0)
                  .text();
                childObj["epSummary"] = $(this)
                  .find(".item_description")
                  .text()
                  .trim();
                childObj["epSummary"] = childObj["epSummary"].replace(/'/g, "");
                childObj["season"] = season;
                returnObj.push(childObj);
              });
            resolve(returnObj);
          }
        }
      );
    });
  }

  /**
   * Gets torrent information for the search term by searching thepiratebay (or at least it's mirror)
   * @param {function} callback
   * @param {string/bool} differentTerm If false, the this.searchTerm value will be used to search for torrents (differentTerm will be used otherwise)
   * @returns {array} An array object containing up to 30 results
   */
  getTorrents(differentTerm, callback) {
    var tpbSearch = differentTerm !== false ? differentTerm : this.searchTerm;
    request(`https://pirateproxy.live/search/${tpbSearch}/1/99/200`, function(
      error,
      response,
      body
    ) {
      if (error) {
        throw new Error(error);
      } else {
        var $ = cheerio.load(body);
        var returnObject = [];
        $("#searchResult > tbody > tr").each(function(i) {
          if (
            $(this)
              .find("a.detLink")
              .text() !== ""
          ) {
            var childObject = {};
            childObject["title"] = $(this)
              .find("a.detLink")
              .text();
            childObject["magnetLink"] = $(this)
              .find('a[title="Download this torrent using magnet"]')
              .attr("href");
            childObject["seeders"] = $(this)
              .find('td[align="right"]')
              .eq(0)
              .text();
            childObject["leechers"] = $(this)
              .find('td[align="right"]')
              .eq(1)
              .text();
            returnObject.push(childObject);
          }
        });
        callback(returnObject);
      }
    });
  }

  /**
   * Returns an array of keywords associated with the show from most relevant to least
   * @param {String} imdbid The IMDb ID of the tv show or movie
   */
  getKeywords(imdbid, callback) {
    let self = this;
    let returnObject = [];
    request(
      `https://www.imdb.com/title/${imdbid}/keywords?ref_=tt_stry_kw`,
      (err, res, body) => {
        if (err) {
          throw new Error(err);
        } else {
          let $ = cheerio.load(body);
          $(".dataTable > tbody")
            .find("tr")
            .each(function() {
              returnObject.push(
                self._mysql_real_escape_string(
                  $(this)
                    .children("td")
                    .attr("data-item-keyword")
                )
              );
            });

          callback(returnObject);
        }
      }
    );
  }

  setSearchTerm(newTerm) {
    this.searchTerm = newTerm;
  }

  _mysql_real_escape_string(str) {
    return str.replace(/'/g, "\\'");
  }
}

module.exports = MetaData;
