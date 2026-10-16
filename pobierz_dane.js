const fs = require('fs');

const WG_APP_ID = process.env.WG_APP_ID || 'f97617376d96e82727df1de63b18c718';

// TUTAJ WPISZ SWOJE TAGI POLSKICH KLANÓW:
const polskieTagi = ['ORZEL', 'HUSAR', 'PL-N', '1SBS', 'SARM']; 

const API_HOST = 'https://' + 'api.worldofwarships.eu';
const CLANS_HOST = 'https://' + 'clans.worldofwarships.eu';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json'
};

function formatujOcene(r) {
  if (!r) return null;
  const bitwy = r.battles_count ?? 0;
  const wygrane = r.wins_count ?? 0;
  return {
    team: r.team_number || 1,
    liga: r.league ?? 4,
    dywizja: r.division ?? 3,
    punkty: r.division_rating ?? 0,
    rating_calkowity: r.public_rating ?? 0,
    bitwy: bitwy,
    wygrane: wygrane,
    wr: bitwy > 0 ? Number(((wygrane / bitwy) * 100).toFixed(1)) : 0
  };
}

async function pobierzDane() {
  const wyniki = [];

  for (const rawTag of polskieTagi) {
    const tag = rawTag.trim().toUpperCase();
    try {
      const searchUrl = `${API_HOST}/wows/clans/list/?application_id=${WG_APP_ID}&search=${encodeURIComponent(tag)}&limit=50`;
      const searchRes = await fetch(searchUrl, { headers });
      const searchData = await searchRes.json();

      if (searchData.status !== 'ok' || !Array.isArray(searchData.data) || searchData.data.length === 0) continue;

      const klanInfo = searchData.data.find(c => c.tag.toUpperCase() === tag) || searchData.data.at(0);
      if (!klanInfo) continue;

      const clanId = klanInfo.clan_id;
      let ocena1 = { liga: 4, dywizja: 3, punkty: 0, rating_calkowity: 0, bitwy: 0, wygrane: 0, wr: 0 };
      let ocena2 = null;

      try {
        const cbUrl = `${CLANS_HOST}/api/clanbase/${clanId}/claninfo/`;
        const cbRes = await fetch(cbUrl, { headers });
        if (cbRes.ok) {
          const cbData = await cbRes.json();
          const ladder = cbData?.clanview?.wows_ladder;

          if (ladder) {
            let listaOcen = [];
            if (Array.isArray(ladder.ratings) && ladder.ratings.length > 0) {
              listaOcen = ladder.ratings;
            } else if (Array.isArray(ladder.last_season_ratings) && ladder.last_season_ratings.length > 0) {
              listaOcen = ladder.last_season_ratings;
            }

            if (listaOcen.length > 0) {
              listaOcen.sort((a, b) => (b.public_rating || 0) - (a.public_rating || 0));
              ocena1 = formatujOcene(listaOcen.at(0));
              if (listaOcen.length > 1) {
                ocena2 = formatujOcene(listaOcen.at(1));
              }
            } else if (ladder.battles_count > 0 || ladder.public_rating > 0) {
              ocena1 = formatujOcene(ladder);
            }
          }
        }
      } catch (cbErr) {
        console.log(`Błąd CB dla ${tag}:`, cbErr.message);
      }

      wyniki.push({
        id: clanId,
        tag: klanInfo.tag,
        nazwa: klanInfo.name,
        ocena1,
        ocena2,
        max_rating: ocena1.rating_calkowity,
        suma_bitew: ocena1.bitwy + (ocena2 ? ocena2.bitwy : 0)
      });

    } catch (err) {
      console.error(`Błąd dla ${tag}:`, err);
    }
  }

  wyniki.sort((a, b) => (b.max_rating - a.max_rating) || (b.suma_bitew - a.suma_bitew));

  fs.mkdirSync('./public', { recursive: true });
  fs.writeFileSync('./public/wyniki.json', JSON.stringify(wyniki, null, 2));
}

pobierzDane();
