const fs = require('fs');

const WG_APP_ID = process.env.WG_APP_ID || 'f97617376d96e82727df1de63b18c718';

// Lista TAGÓW polskich klanów do śledzenia
const polskieTagi = ['ORZEL', 'HUSAR', 'PL-N', '1SBS', 'SARM', 'SZTUR', ' Husaria']; 

const API_HOST = 'https://' + 'api.worldofwarships.eu';
const CLANS_HOST = 'https://' + 'clans.worldofwarships.eu';

// Udajemy zwykłą przeglądarkę, żeby serwer klanowy WoWS nie blokował GitHuba
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json'
};

async function pobierzDane() {
  const wyniki = [];

  for (const rawTag of polskieTagi) {
    const tag = rawTag.trim().toUpperCase();
    try {
      // 1. Szukamy klanu w oficjalnym API Wargamingu
      const searchUrl = `${API_HOST}/wows/clans/list/?application_id=${WG_APP_ID}&search=${encodeURIComponent(tag)}&limit=20`;
      const searchRes = await fetch(searchUrl, { headers });
      const searchData = await searchRes.json();

      console.log(`Szukam [${tag}] -> status:`, searchData.status);

      if (searchData.status !== 'ok' || !searchData.data || searchData.data.length === 0) continue;

      // Dopasowujemy dokładny tag (lub bierzemy pierwszy z brzegu, jeśli dokładnego nie ma)
      const klanInfo = searchData.data.find(c => c.tag.toUpperCase() === tag) || searchData.data[0];
      const clanId = klanInfo.clan_id;

      // Domyślne wartości (gdyby klan nie grał jeszcze w tym sezonie CB)
      let liga = 4, dywizja = 3, punkty = 0, rating_calkowity = 0, bitwy = 0;

      // 2. Pobieramy dane Bitew Klanowych
      try {
        const cbUrl = `${CLANS_HOST}/api/clanbase/${clanId}/claninfo/`;
        const cbRes = await fetch(cbUrl, { headers });
        if (cbRes.ok) {
          const cbData = await cbRes.json();
          const ladder = cbData?.clanview?.wows_ladder;
          if (ladder) {
            liga = ladder.league ?? 4;
            dywizja = ladder.division ?? 3;
            punkty = ladder.division_rating ?? 0;
            rating_calkowity = ladder.public_rating ?? 0;
            bitwy = ladder.battles_count ?? 0;
          }
        }
      } catch (cbErr) {
        console.log(`Brak danych CB dla ${tag}, zostawiam domyślne.`);
      }

      wyniki.push({
        id: clanId,
        tag: klanInfo.tag,
        nazwa: klanInfo.name,
        liga,
        dywizja,
        punkty,
        rating_calkowity,
        bitwy
      });

      console.log(`Dodano klan: [${klanInfo.tag}] ${klanInfo.name}`);
    } catch (err) {
      console.error(`Błąd dla ${tag}:`, err);
    }
  }

  // Sortujemy od najlepszego ratingu (a przy remisie po liczbie bitew)
  wyniki.sort((a, b) => (b.rating_calkowity - a.rating_calkowity) || (b.bitwy - a.bitwy));

  fs.mkdirSync('./public', { recursive: true });
  fs.writeFileSync('./public/wyniki.json', JSON.stringify(wyniki, null, 2));
  console.log(`Zapisano ${wyniki.length} klanów do public/wyniki.json!`);
}

pobierzDane();
