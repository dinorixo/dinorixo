const JIKAN = "https://api.jikan.moe/v4";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/search") {
      const q = url.searchParams.get("q") || "";

      if (!q.trim()) {
        return Response.json({ data: [] }, { status: 400 });
      }

      try {
        const response = await fetch(
          JIKAN +
          "/anime?q=" +
          encodeURIComponent(q) +
          "&limit=24"
        );

        const text = await response.text();

        return new Response(text, {
          status: response.status,
          headers: {
            "content-type": "application/json",
            "cache-control": "public, max-age=300"
          }
        });

      } catch (error) {
        return Response.json(
          { error: "Anime search temporarily unavailable" },
          { status: 502 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
