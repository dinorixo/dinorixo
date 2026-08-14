const q = new URLSearchParams(location.search);

const anime = q.get("anime") || "Demon Slayer";
const episode = q.get("episode") || "1";

localStorage.setItem(
"dixorinoContinue",
JSON.stringify({
name: anime,
episode: Number(episode)
})
);
