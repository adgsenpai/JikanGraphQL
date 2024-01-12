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
  media: [Anime]
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
  indexPage(perPage: Int, page: Int, seasonYear: Int): Page
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
        media: paginatedList
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
      // Fetch popular anime for the given season year
      const season = new Date().getMonth() <= 3 ? 'winter' :
        new Date().getMonth() <= 6 ? 'spring' :
          new Date().getMonth() <= 9 ? 'summer' : 'fall';

      const response = await fetch(`https://api.jikan.moe/v4/seasons/${seasonYear}/${season}?sort=desc`);
      const data = await response.json();

      // Filter and map data for AnimeBanner
      const popularAnime = data.data.map(anime => {
        return {
          id: anime.mal_id,
          title: {
            romaji: anime.title,
            english: anime.title_english
          },
          bannerImage: anime.images.jpg.large_image_url,
          description: anime.synopsis,
          format: anime.type,
          duration: anime.duration,
          meanScore: anime.score,
          genres: anime.genres.map(genre => genre.name),
          season: anime.season, // Ensure this field is provided by the API
          startDate: {
            year: anime.aired.from ? new Date(anime.aired.from).getFullYear() : null,
          }
        };
      });

      // You might want to implement further logic to sort by popularity or limit the number of results
      return popularAnime;
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
        media: searchedAnime
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
        media: genreAnime
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
        media: animeList
      };
    },
    indexPage: async (_, { perPage, page, seasonYear }) => {
      // Resolver for fetching banner anime
      const bannerResponse = await fetch(`https://api.jikan.moe/v4/seasons/${seasonYear}?sort=popularity&limit=1`);
      const bannerData = await bannerResponse.json();
      const bannerAnime = bannerData.data.map(anime => mapAnimeBannerData(anime));

      // Resolver for fetching trending anime
      const trendingResponse = await fetch(`https://api.jikan.moe/v4/top/anime?type=anime&filter=trending&page=${page}&limit=${perPage}`);
      const trendingData = await trendingResponse.json();
      const trendingAnime = trendingData.data.map(anime => mapAnimeInfoData(anime));

      // Resolver for fetching popular anime
      const popularResponse = await fetch(`https://api.jikan.moe/v4/top/anime?type=anime&filter=popular&page=${page}&limit=${perPage}`);
      const popularData = await popularResponse.json();
      const popularAnime = popularData.data.map(anime => mapAnimeInfoData(anime));

      // Resolver for fetching top-rated anime
      const topRatedResponse = await fetch(`https://api.jikan.moe/v4/top/anime?type=anime&filter=best&page=${page}&limit=${perPage}`);
      const topRatedData = await topRatedResponse.json();
      const topRatedAnime = topRatedData.data.map(anime => mapAnimeInfoData(anime));

      return {
        banner: bannerAnime,
        trending: { media: trendingAnime },
        popular: { media: popularAnime },
        topRated: { media: topRatedAnime }
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
          mediaRecommendation: recommendedAnime
        }
      };
    },
    

  }

};

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

