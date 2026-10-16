const fs = require('fs');

const WG_APP_ID = process.env.WG_APP_ID || 'f97617376d96e82727df1de63b18c718';

// Lista polskich klanów (m.in. te z Twojego screena - możesz dopisać kolejne!)
const polskieTagi = [
  'SEEYA', 'CM69', '505PL', 'OMRK', 'N0R1S', 'P_G_O', 'PMT', 'FHC',
  'TF10', 'MD-PL', 'G0R2Y', 'S-E', 'S_B_O', 'C0DE', 'B_S_W', '16_PD',
  'ORZEL', 'HUSAR', 'PL-N', '1SBS', 'SARM'
];

const API_HOST = 'https://' + 'api.worldofwarships.eu';
const CLANS_HOST = 'https://' + 'clans.worldofwarships.eu';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json'
};

function parsujOcene(r) {
  if (!r) return null;
  const bitwy = r.battles_count ?? 0;
  const wygrane = r.wins_count ?? 0;
  return {
    team_number: r.team_number || 1,
    rating_name: r.team_number === 2 ? 'Bravo' : 'Alpha',
    liga: r.league ?? 4,
    dywizja: r.division ?? 3,
    punkty: r.division_rating ?? 0,
    rating_calkowity: r.public_rating ?? 0,
    max_liga: r.max_position?.league ?? r.league ?? 4,
    max_dywizja: r.max_position?.division ?? r.division ?? 3,
    max_punkty: r.max_position?.division_rating ?? r.division_rating ?? 0,
    max_rating_calkowity: r.max_public_rating ?? r.public_rating ?? 0,
    bitwy: bitwy,
    wygrane: wygrane,
    wr: bitwy > 0 ? Number(((wygrane / bitwy) * 100).toFixed(2)) : 0,
    season_number: r.season_number || null
  };
}

async function pobierzDane() {
  const wyniki = [];
  let aktualnySezon = 33;

  for (const rawTag of polskieTagi) {
    const tag = rawTag.trim().toUpperCase();
    try {
      const searchUrl = `${API_HOST}/wows/clans/list/?application_id=${WG_APP_ID}&search=${encodeURIComponent(tag)}&limit=50`;
      const searchRes = await fetch(searchUrl, { headers });
      const searchData = await searchRes.json();

      if (searchData.status !== 'ok' || !Array.isArray(searchData.data) || searchData.data.length === 0) continue;

      const klanInfo = searchData.data.find(c => c.tag.toUpperCase() === tag);
      if (!klanInfo) continue;

      const clanId = klanInfo.clan_id;
      let oceny = [];

      try {
        const cbUrl = `${CLANS_HOST}/api/clanbase/${clanId}/claninfo/`;
        const cbRes = await fetch(cbUrl, { headers });
        if (cbRes.ok) {
          const cbData = await cbRes.json();
          const ladder = cbData?.clanview?.wows_ladder;

          if (ladder) {
            if (ladder.season_number) aktualnySezon = ladder.season_number;

            let suroweOceny = [];
            if (Array.isArray(ladder.ratings) && ladder.ratings.length > 0) {
              suroweOceny = ladder.ratings;
            } else if (Array.isArray(ladder.last_season_ratings) && ladder.last_season_ratings.length > 0) {
              suroweOceny = ladder.last_season_ratings;
            } else if (ladder.battles_count > 0 || ladder.public_rating > 0) {
              suroweOceny = [ladder];
            }

            oceny = suroweOceny.map(parsujOcene).filter(Boolean);
          }
        }
      } catch (e) {
        console.log(`Błąd CB dla ${tag}:`, e.message);
      }

      if (oceny.length === 0) {
        oceny.push({
          team_number: 1,
          rating_name: 'Alpha',
          liga: 4, dywizja: 3, punkty: 0, rating_calkowity: 0,
          max_liga: 4, max_dywizja: 3, max_punkty: 0, max_rating_calkowity: 0,
          bitwy: 0, wygrane: 0, wr: 0
        });
      }

      wyniki.push({
        id: clanId,
        tag: klanInfo.tag,
        nazwa: klanInfo.name,
        sezon: aktualnySezon,
        oceny: oceny
      });

    } catch (err) {
      console.error(`Błąd dla ${tag}:`, err);
    }
  }

  fs.mkdirSync('./public', { recursive: true });
  fs.writeFileSync('./public/wyniki.json', JSON.stringify(wyniki, null, 2));
}

pobierzDane();
