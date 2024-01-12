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

  type Anime {
    id: ID!
    title: Title
    coverImage: CoverImage
    format: String
    duration: Int
    meanScore: Int
    nextAiringEpisode: NextAiringEpisode
  }

  type Query {
    anime(id: ID!): Anime
  }
`;
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
                nextAiringEpisode: null // Jikan may not provide this information
            };
        }
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