import axios from "axios";

interface Metadata {
  title: string;
  length: number;
  artist: string;
  release: string;
  album: string;
  coverArt: string;
}

async function fetchMetadata(mbid: string): Promise<Metadata | null> {
  try {
    const metaResponse = await axios.get(
      `https://musicbrainz.org/ws/2/recording/${mbid}?inc=releases+artists&fmt=json`
    );
    const result = metaResponse.data;
    let cover: string;
    try {
      const release = result.releases[0]["id"];
      const coverResponse = await axios.get(
        `https://coverartarchive.org/release/${release}`
      );
      cover = coverResponse.headers.location;
    } catch (e) {
      cover = "";
    }
    const meta = {
      title: result.title,
      length: result.length,
      artist: result["artist-credit"][0].artist.name,
      release: result.releases[0]["release-events"][0].date,
      album: result.releases[0].title,
      coverArt: cover,
    };
    return meta;
  } catch (e) {
    return null;
  }
}

export default fetchMetadata;
