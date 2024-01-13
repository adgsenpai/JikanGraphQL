//
//
//  index.ts
//  Ashlin Darius Govindasamy
//  https://adgstudios.co.za
//  https://anime.adgstudios.co.za
//  AnimeFlix Production API Code
//  Leveraging https://jikan.moe/
//

import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import fetch from 'node-fetch';
 
const typeDefs = `
type Title {
  english: String
  romaji: String
}

type CoverImage {
  color: String
  medium: String
  large: String
}

type NextAiringEpisode {
  airingAt: Int
  timeUntilAiring: Int
  episode: Int
}

type StartDate {
  year: Int
}

type Anime {
  id: ID!
  title: Title
  coverImage: CoverImage
  format: String
  duration: Int
  meanScore: Int
  nextAiringEpisode: NextAiringEpisode
  bannerImage: String
  description: String
  genres: [String]
  season: String
  startDate: StartDate
}

type Page {
  Media: [Anime]  
}

type IndexPage{
  banner: banner
  trending: trending
  popular: popular
  topRated: popular
}

type Media {
  id: ID!
  title: Title
  coverImage: CoverImage
  format: String
  duration: Int
  meanScore: Int
  nextAiringEpisode: NextAiringEpisode
  bannerImage: String
  description: String
  genres: [String]
  season: String
  startDate: StartDate
  status: String
}

type banner {
  Media: [Media]
}

type trending {
  Media: [Media]
}

type popular{
  Media: [Media]
}

type Query {
  anime(id: ID!): Anime
  getAnimeBanner(id: ID!): Anime
  getAnimeInfo(id: ID!): Anime
  getAnimeByIds(perPage: Int, page: Int, ids: [Int]): Page
  getAnimeTitle(id: ID!): Title
  getPopularBanner(seasonYear: Int): [Anime]
  searchAnime(page: Int, perPage: Int, keyword: String): Page
  searchGenre(page: Int, perPage: Int, genre: String): Page
  getList(perPage: Int, page: Int, sort: [String]): Page
  indexPage(perPage: Int, page: Int, seasonYear: Int): IndexPage
  animePage(id: ID!, perPage: Int): Page
  watchPage(id: ID!, perPage: Int): Page
}
`;

var mapAnimeBannerData = (anime: any) => {
  return {
    id: anime.mal_id,
    title: {
      english: anime.title_english,
      romaji: anime.title
    },
    coverImage: {
      color: null, // Jikan may not provide this information
      medium: anime.images.jpg.image_url,
      large: anime.images.jpg.large_image_url
    },
    bannerImage: anime.images.large_image_url, 
    format: anime.type,
    duration: anime.duration,
    meanScore: anime.score,
    nextAiringEpisode: null
  };
};

var mapAnimeInfoData = (data) => {
  return {
      id: data.mal_id,
      title: {
          english: data.title_english,
          romaji: data.title
      },
      coverImage: {
          color: null, // Jikan may not provide this information
          medium: data.images.jpg.image_url,
          large: data.images.jpg.large_image_url
      },
      format: data.type,
      duration: data.duration,
      meanScore: data.score,      
      nextAiringEpisode: null // Additional logic needed if this info is available
  };
}


const resolvers = {
  Query: {
    anime: async (_, { id }) => {
      const response = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
      const data = await response.json();

      // Map Jikan response to the AnimeInfo schema
      return {
        id: data.data.mal_id,
        title: {
          english: data.data.title_english,
          romaji: data.data.title
        },
        coverImage: {
          color: null, // Jikan may not provide this information
          medium: data.data.images.jpg.image_url,
          large: data.data.images.jpg.large_image_url
        },
        format: data.data.type,
        duration: data.data.duration,
        meanScore: data.data.score,
        nextAiringEpisode: null, // Jikan may not provide this information
        bannerImage: data.data.images.jpg.large_image_url, // or appropriate field
        description: data.data.synopsis,
        genres: data.data.genres.map(genre => genre.name),
        season: data.data.season,
        startDate: {
          year: data.data.aired.from ? new Date(data.data.aired.from).getFullYear() : null,
        },
      };
    },
    getAnimeBanner: async (_, { id }) => {
      const response = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
      const data = await response.json();

      // Map Jikan response to the AnimeBanner structure
      return {
        id: data.mal_id,
        title: {
          english: data.title_english,
          romaji: data.title
        },
        bannerImage: data.images.jpg.large_image_url, // Assuming banner image is mapped here
        description: data.synopsis,
        format: data.type,
        duration: data.duration,
        meanScore: data.score,
        genres: data.genres.map(genre => genre.name),
        season: data.season,
        startDate: {
          year: data.aired.from ? new Date(data.aired.from).getFullYear() : null,
        },
      };
    },
    getAnimeInfo: async (_, { id }) => {
      const response = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
      const data = await response.json();

      // Map Jikan response to the AnimeInfo structure
      return {
        id: data.mal_id,
        title: {
          english: data.title_english,
          romaji: data.title
        },
        coverImage: {
          color: null, // Jikan may not provide this information
          medium: data.images.jpg.image_url,
          large: data.images.jpg.large_image_url
        },
        format: data.type,
        duration: data.duration,
        meanScore: data.score,
        nextAiringEpisode: null // You will need to fetch or calculate this, if available
      };
    },
    getAnimeByIds: async (_, { perPage, page, ids }) => {
      // Handle pagination and fetching multiple anime
      const animeList = [];
      for (let id of ids) {
        const response = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
        const data = await response.json();
        animeList.push(mapAnimeInfoData(data)); // Use mapAnimeInfoData function
      }

      // Implement logic for handling perPage and page (pagination)
      const startIndex = (page - 1) * perPage;
      const paginatedList = animeList.slice(startIndex, startIndex + perPage);

      return {
        Media: paginatedList
      };
    },
    getAnimeTitle: async (_, { id }) => {
      const response = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
      var data = await response.json();
      data = mapAnimeInfoData(data);
          
      return {
        title: {
          romaji: data.title,
          english: data.title_english
        }
      };
    },
    getPopularBanner: async (_, { seasonYear }) => {
      // Determine the current season based on month and year
      const currentMonth = new Date().getMonth();
      const season = currentMonth <= 2 ? 'winter' : 
                     currentMonth <= 5 ? 'spring' : 
                     currentMonth <= 8 ? 'summer' : 'fall';
    
      // Fetch popular anime for the given season year
      const response = await fetch(`https://api.jikan.moe/v4/seasons/${seasonYear}/${season}?sort=popularity`);
      const data = await response.json();
    
      // Map and return data for AnimeBanner
      return data.data.map(anime => mapAnimeBannerData(anime));
    },
    
    searchAnime: async (_, { page, perPage, keyword }) => {
      const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(keyword)}&page=${page}&limit=${perPage}`);
      const data = await response.json();

      const searchedAnime = data.data.map(anime => {
        // Map the data for each anime to the AnimeInfo structure
        return {
          id: anime.mal_id,
          title: {
            english: anime.title_english,
            romaji: anime.title
          },
          coverImage: {
            color: null, // Jikan may not provide this information
            medium: anime.images.jpg.image_url,
            large: anime.images.jpg.large_image_url
          },
          format: anime.type,
          duration: anime.duration,
          meanScore: anime.score,
          nextAiringEpisode: null // Additional logic needed if this info is available
        };
      });

      return {
        Media: searchedAnime
      };
    },
    searchGenre: async (_, { page, perPage, genre }) => {
      const response = await fetch(`https://api.jikan.moe/v4/anime?genre=${encodeURIComponent(genre)}&order_by=popularity&sort=desc&page=${page}&limit=${perPage}`);
      const data = await response.json();

      const genreAnime = data.data.map(anime => {
        // Map the data for each anime to the AnimeInfo structure
        return {
          id: anime.mal_id,
          title: {
            english: anime.title_english,
            romaji: anime.title
          },
          coverImage: {
            color: null, // Jikan may not provide this information
            medium: anime.images.jpg.image_url,
            large: anime.images.jpg.large_image_url
          },
          format: anime.type,
          duration: anime.duration,
          meanScore: anime.score,
          nextAiringEpisode: null // Additional logic might be required here
        };
      });

      return {
        Media: genreAnime
      };
    },
    getList: async (_, { perPage, page, sort }) => {
      // Construct the sort query parameter
      const sortParam = sort.join(',');

      const response = await fetch(`https://api.jikan.moe/v4/anime?order_by=${encodeURIComponent(sortParam)}&page=${page}&limit=${perPage}`);
      const data = await response.json();

      const animeList = data.data.map(anime => {
        // Map the data for each anime to the AnimeInfo structure
        return {
          id: anime.mal_id,
          title: {
            english: anime.title_english,
            romaji: anime.title
          },
          coverImage: {
            color: null,
            medium: anime.images.jpg.image_url,
            large: anime.images.jpg.large_image_url
          },
          format: anime.type,
          duration: anime.duration,
          meanScore: anime.score,
          nextAiringEpisode: null // Additional logic might be required
        };
      });

      return {
        Media: animeList
      };
    },
    indexPage: async (_, { perPage, page, seasonYear }) => {
      // Fetch banner anime for the given season year, sorted by popularity
      const season = determineSeason();
      console.log(season);
      const bannerResponse = await fetch(`https://api.jikan.moe/v4/seasons/${seasonYear}/${season}?sort=popularity&limit=1`);
      const bannerData = await bannerResponse.json();
      console.log(bannerData);
      const bannerAnime = bannerData.data.map(anime => mapAnimeBannerData(anime));
      console.log('bannerAnime', bannerAnime);
    
      // Fetch trending anime
      const trendingAnime = await fetchSortedAnime('favorite', perPage, page);
      console.log('trendingAnime', trendingAnime);
    
      // Fetch popular anime
      const popularAnime = await fetchSortedAnime('bypopularity', perPage, page);
      console.log('popularAnime', popularAnime);
    
      // Fetch top-rated anime
      const topRatedAnime = await fetchSortedAnime('favorite', perPage, page);
      console.log('topRatedAnime', topRatedAnime);
    
      return {
        banner: { Media: bannerAnime },  
        trending: { Media: trendingAnime },
        popular: { Media: popularAnime },
        topRated: { Media: topRatedAnime }
      };
    },
    animePage: async (_, { id, perPage }) => {
      // Fetch detailed information about a specific anime
      const animeResponse = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
      const animeData = await animeResponse.json();
      const animeInfo = mapAnimeInfoData(animeData); // Use existing mapping function
      const animeBanner = mapAnimeBannerData(animeData); // Use existing mapping function

      // Fetch recommendations based on the anime ID
      const recommendationsResponse = await fetch(`https://api.jikan.moe/v4/anime/${id}/recommendations?page=1&limit=${perPage}`);
      const recommendationsData = await recommendationsResponse.json();
      const recommendedAnime = recommendationsData.data.map(rec => mapAnimeInfoData(rec.entry));

      return {
        Media: {
          ...animeInfo,
          ...animeBanner,
          status: animeData.status
        },
        recommended: {
          recommendations: recommendedAnime
        }
      };
    },
    watchPage: async (_, { id, perPage }) => {
      // Fetch detailed information about the anime
      const animeResponse = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
      const animeData = await animeResponse.json();
      const animeInfo = mapAnimeInfoData(animeData); // Use existing mapping function for AnimeInfo
      const animeBanner = mapAnimeBannerData(animeData); // Use existing mapping function for AnimeBanner
    
      // Fetch recommendations based on the anime ID
      const recommendationsResponse = await fetch(`https://api.jikan.moe/v4/anime/${id}/recommendations?page=1&limit=${perPage}`);
      const recommendationsData = await recommendationsResponse.json();
      const recommendedAnime = recommendationsData.data.map(rec => ({
        ...mapAnimeInfoData(rec.entry),
        ...mapAnimeBannerData(rec.entry)
      }));
    
      return {
        anime: {
          ...animeInfo,
          ...animeBanner
        },
        recommended: {
          MediaRecommendation: recommendedAnime
        }
      };
    },
    

  }

};

// Helper function to fetch sorted anime list
async function fetchSortedAnime(filter, perPage, page) {
  try {
    //https://api.jikan.moe/v4/top/anime?type=tv&filter=airing&page=1&limit=8
    const response = await fetch(`https://api.jikan.moe/v4/top/anime?type=tv&filter=${filter}&page=${page}&limit=${perPage}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('data', data);
    
    // Check if data.data is an array and has items
    if (Array.isArray(data.data) && data.data.length > 0) {
      return data.data.map(anime => mapAnimeInfoData(anime));
    } else {
      // Handle the case where data.data is empty or not an array
      console.log('No data found or data is not in expected format');
      return [];
    }
  } catch (error) {
    console.error('Error fetching sorted anime:', error);
    return []; // Return empty array in case of error
  }
}


// Helper function to determine the current season
function determineSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) {
    return 'spring';
  } else if (month >= 6 && month <= 8) {
    return 'summer';
  } else if (month >= 9 && month <= 11) {
    return 'fall';
  } else {
    return 'winter';
  }
}

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);

