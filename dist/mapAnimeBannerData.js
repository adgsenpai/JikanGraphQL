export var mapAnimeBannerData = (anime) => {
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
