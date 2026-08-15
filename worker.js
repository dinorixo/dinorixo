const ANILIST = "https://graphql.anilist.co";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/search") {
      const q = url.searchParams.get("q") || "";

      if (!q.trim()) {
        return Response.json({ data: [] }, { status: 400 });
      }

      const query = `
        query ($search: String) {
          Page(page: 1, perPage: 24) {
            media(
              search: $search
              type: ANIME
              sort: SEARCH_MATCH
            ) {
              id
              idMal
              title {
                romaji
                english
                native
              }
              coverImage {
                large
                medium
              }
              averageScore
              episodes
              format
              status
              description
              genres
              season
              seasonYear
            }
          }
        }
      `;

      try {
        const response = await fetch(ANILIST, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "accept": "application/json",
            "user-agent": "DIXORINO/1.0"
          },
          body: JSON.stringify({
            query,
            variables: {
              search: q
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();

          return new Response(errorText || "AniList error", {
            status: response.status,
            headers: {
              "content-type": "application/json"
            }
          });
        }

        const json = await response.json();

        const data = (json.data?.Page?.media || []).map(a => ({
          mal_id: a.idMal || a.id,
          title: a.title?.english ||
                 a.title?.romaji ||
                 a.title?.native ||
                 "Unknown",
          title_english: a.title?.english || null,
          images: {
            jpg: {
              large_image_url: a.coverImage?.large ||
                                a.coverImage?.medium ||
                                ""
            }
          },
          score: a.averageScore
            ? a.averageScore / 10
            : null,
          episodes: a.episodes,
          type: a.format,
          status: a.status,
          synopsis: a.description
            ? a.description.replace(/<[^>]*>/g, "")
            : "",
          genres: (a.genres || []).map(name => ({
            name
          }))
        }));

        return Response.json(
          { data },
          {
            headers: {
              "cache-control": "public, max-age=300"
            }
          }
        );

      } catch (error) {
        console.error(error);

        return Response.json(
          { error: "Anime search temporarily unavailable" },
          { status: 502 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
