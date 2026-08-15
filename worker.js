const ANILIST = "https://anilist.co";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/search") {
      const q = url.searchParams.get("q") || "";               
      if (!q.trim()) return Response.json({ data: [] }, { status: 400 });

      const query = `query ($search: String) { Page(page: 1, perPage: 24) { media(search: $search, type: ANIME, sort: SEARCH_MATCH) { id idMal title { romaji english native } coverImage { large medium } averageScore episodes format status description genres season seasonYear } } }`;

      try {
        const response = await fetch(ANILIST, {
          method: "POST",
          headers: { "content-type": "application/json", "accept": "application/json", "user-agent": "DIXORINO/1.0" },
          body: JSON.stringify({ query, variables: { search: q } })
        });

        if (!response.ok) return new Response(await response.text(), { status: response.status, headers: { "content-type": "application/json" } });
        const json = await response.json();

        const data = (json.data?.Page?.media || []).map(a => ({
          mal_id: a.idMal || a.id,
          title: a.title?.english || a.title?.romaji || a.title?.native || "Unknown",
          title_english: a.title?.english || null,
          images: { jpg: { large_image_url: a.coverImage?.large || a.coverImage?.medium || "" } },
          score: a.averageScore ? a.averageScore / 10 : null,
          episodes: a.episodes, type: a.format, status: a.status,
          synopsis: a.description ? a.description.replace(/<[^>]*>/g, "") : "",
          genres: (a.genres || []).map(name => ({ name }))
        }));

        return Response.json({ data }, { headers: { "cache-control": "public, max-age=300" } });
      } catch (error) {
        return Response.json({ error: "Search temporarily unavailable" }, { status: 502 });
      }
    }

    if (url.pathname === "/api/episodes") {
      const animeId = url.searchParams.get("id");
      if (!animeId) return Response.json({ error: "Missing ID" }, { status: 400 });
      try {
        const res = await fetch(`https://anify.tv{animeId}`);
        if (!res.ok) return Response.json({ episodes: [] });
        const data = await res.json();
        return Response.json({ episodes: data.episodes?.data || [] }, {
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }
        });
      } catch (err) {
        return Response.json({ error: "Failed to fetch episodes" }, { status: 500 });
      }
    }

    if (url.pathname === "/api/stream") {
      const episodeId = url.searchParams.get("episodeId");
      const episodeNumber = url.searchParams.get("number") || "1";
      const animeId = url.searchParams.get("animeId");
      if (!episodeId || !animeId) return Response.json({ error: "Missing params" }, { status: 400 });
      try {
        const res = await fetch(`https://anify.tv{animeId}/${episodeId}/${episodeNumber}/zoro`);
        const streamData = await res.json();
        return Response.json(streamData, {
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }
        });
      } catch (err) {
        return Response.json({ error: "Stream unavailable" }, { status: 500 });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
