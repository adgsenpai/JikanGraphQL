export var mapAnimeInfoData = (data) => {
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
};
