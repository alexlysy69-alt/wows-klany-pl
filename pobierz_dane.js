const fs = require('fs');

const WG_APP_ID = process.env.WG_APP_ID || 'f97617376d96e82727df1de63b18c718';

// Lista TAGÓW polskich klanów do śledzenia (możesz tu dopisać dowolne kolejne!)
const polskieTagi = ['ORZEL', 'HUSAR', 'PL-N', '1SBS', 'SARM']; 

async function pobierzDane() {
  const wyniki = [];

  for (const tag of polskieTagi) {
    try {
      const searchUrl = `https://worldofwarships.eu{WG_APP_ID}&search=${tag}&limit=10`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (searchData.status !== 'ok' || !searchData.data) continue;

      const klanInfo = searchData.data.find(c => c.tag === tag.toUpperCase());
      if (!klanInfo) continue;

      const clanId = klanInfo.clan_id;

      const cbUrl = `https://worldofwarships.eu{clanId}/claninfo/`;
      const cbRes = await fetch(cbUrl);
      const cbData = await cbRes.json();

      const ladder = cbData.clanview.wows_ladder;

      wyniki.push({
        id: clanId,
        tag: klanInfo.tag,
        nazwa: klanInfo.name,
        liga: ladder.league,
        dywizja: ladder.division,
        punkty: ladder.division_rating,
        rating_calkowity: ladder.public_rating || 0,
        bitwy: ladder.battles_count
      });
    } catch (err) {
      console.error(`Błąd dla ${tag}:`, err);
    }
  }

  wyniki.sort((a, b) => b.rating_calkowity - a.rating_calkowity);

  fs.mkdirSync('./public', { recursive: true });
  fs.writeFileSync('./public/wyniki.json', JSON.stringify(wyniki, null, 2));
}

pobierzDane();
