// https://stackoverflow.com/questions/66965119/how-to-get-information-about-all-videos-of-a-channel-to-google-sheets-with-googl/66965120#66965120
var API_KEY='[INSERT YOUR API KEY HERE]'
var CHANNELS_URL = 'https://www.googleapis.com/youtube/v3/channels'
var PLAYLIST_ITEMS_URL = 'https://youtube.googleapis.com/youtube/v3/playlistItems'
var VIDEOS_URL =  'https://youtube.googleapis.com/youtube/v3/videos'

/** 
 * @param {string} ID of the channel
 * @return {string} ID of the playlist that contains all video uploads
 */
function GET_UPLOADS_PLAYLIST_ID(channel_id){
  url_uploads_id = CHANNELS_URL + "?part=contentDetails&id=" + channel_id + "&key=" + API_KEY;
  return ImportJSON(url_uploads_id, "/items/contentDetails/relatedPlaylists/uploads", "noHeaders")
}

/** 
 * @param {string} ID of a playlist
 * @return {string} URL to be used in the API call
 */
function GET_VIDEO_INFO(playlist_id){
  items_url = PLAYLIST_ITEMS_URL + "?part=contentDetails&maxResults=50&playlistId=" + playlist_id + "&key=" + API_KEY;
  return items_url;
}

/** 
 * @param {string} ID of a playlist
 * @return {array} Two dimensional array that contains all video IDs and total page number
 * 
 * See pagination here: https://developers.google.com/youtube/v3/guides/implementation/pagination
 */
function GET_ALL_VIDEOS_IDS_AS_ARRAY(channel_id){
  var uploads_id = GET_UPLOADS_PLAYLIST_ID(channel_id)
  var video_ids = []
  var page_count = 0
  var next_page_token = ""
  api_url = GET_VIDEO_INFO(uploads_id) + "&pageToken=" + next_page_token
  while (1){
    page_count += 1
    video_ids.push(ImportJSON(api_url, "/items/contentDetails/videoId", "noHeaders"))
    next_page_token = ImportJSON(api_url, "/nextPageToken", "noHeaders")
    api_url = GET_VIDEO_INFO(uploads_id) + "&pageToken=" + next_page_token
    if(ImportJSON(api_url, "/nextPageToken", "noHeaders").length == 0){
      page_count += 1
      video_ids.push(ImportJSON(api_url, "/items/contentDetails/videoId", "noHeaders"))
      break
    } 
  }
  return [video_ids, page_count]
}

/**
 * @param {string} ID of a channel
 * Fetches statistics to the active sheet
 */
function  MULTIPLE_IDS_TO_STATS(channel_id){
  var row = 'A'
  var array = GET_ALL_VIDEOS_IDS_AS_ARRAY(channel_id)
  var page_number = array[1]

  for (var i = 0; i < page_number; i++){
    var col = i*51 + 1
    var cell = row + col
    var video_ids = array[0][i].join()
    var api_url = VIDEOS_URL + "?part=snippet,statistics" + "&fields=items(id,snippet(title,description,tags),statistics)" +"&id=" + video_ids + "&key=" + API_KEY;
    if (col>2){
      formula = '=ImportJSON("' + api_url + '" , "", "noHeaders") '
    } else {
      formula = '=ImportJSON("' + api_url + '" , "", "") '
    }
    SpreadsheetApp.getActiveSheet().getRange(cell).setFormula(formula)
  }
  
}
