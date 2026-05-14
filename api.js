const ANILIST_URL = 'https://graphql.anilist.co';

const queries = {
    trending: `
        query {
            Page(page: 1, perPage: 12) {
                media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
                    id
                    idMal
                    title { english romaji }
                    coverImage { extraLarge large }
                    bannerImage
                    averageScore
                    genres
                    episodes
                    seasonYear
                    description
                }
            }
        }
    `,
    popular: `
        query {
            Page(page: 1, perPage: 12) {
                media(type: ANIME, sort: POPULARITY_DESC, isAdult: false
) {
                    id
                    idMal
                    title { english romaji }
                    coverImage { extraLarge large }
                    bannerImage
                    averageScore
                    genres
                    episodes
                    seasonYear
                    description
                }
            }
        }
    `,
    search: `
        query ($search: String) {
            Page(page: 1, perPage: 20) {
                media(search: $search, type: ANIME, sort: SEARCH_MATCH, isAdult: false) {
                    id
                    idMal
                    title { english romaji }
                    coverImage { extraLarge large }
                    bannerImage
                    averageScore
                    genres
                    episodes
                    seasonYear
                    description
                }
            }
        }
    `,
    featured: `
        query {
            Media(search: "Attack on Titan", type: ANIME, isAdult: false) {
                id
                idMal
                title { english romaji }
                coverImage { extraLarge large }
                bannerImage
                averageScore
                genres
                episodes
                seasonYear
                description
                trailer { id site thumbnail }
            }
        }
    `,
    getById: `
        query ($id: Int) {
            Media(id: $id, type: ANIME, isAdult: false) {
                id
                idMal
                title { english romaji }
                coverImage { extraLarge large }
                bannerImage
                averageScore
                genres
                episodes
                seasonYear
                description
                trailer { id site thumbnail }
                recommendations {
                    nodes {
                        mediaRecommendation {
                            id
                            title { english romaji }
                            coverImage { large }
                            averageScore
                        }
                    }
                }
            }
        }
    `
};

async function fetchFromAniList(query, variables = {}) {
    try {
        const response = await fetch(ANILIST_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ query, variables })
        });
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('AniList API Error:', error);
        return null;
    }
}

const api = {
    getTrending: () => fetchFromAniList(queries.trending),
    getPopular: () => fetchFromAniList(queries.popular),
    searchAnime: (search) => fetchFromAniList(queries.search, { search }),
    getFeatured: () => fetchFromAniList(queries.featured),
    getAnimeById: (id) => fetchFromAniList(queries.getById, { id }),
};
