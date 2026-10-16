const fs = require('fs');

const WG_APP_ID = process.env.WG_APP_ID || 'f97617376d96e82727df1de63b18c718';

const polskieKlany = [
  { "id": 500260084, "tag": "NEXT-" }, { "id": 500187112, "tag": "-BWM-" },
  { "id": 500188332, "tag": "MESSA" }, { "id": 500188874, "tag": "P-W-C" },
  { "id": 500178562, "tag": "WIDMO" }, { "id": 500223310, "tag": "-BWMA" },
  { "id": 500238318, "tag": "GFMW" }, { "id": 500174874, "tag": "MORSY" },
  { "id": 500147756, "tag": "PVVC" }, { "id": 500171731, "tag": "BURZA" },
  { "id": 500205707, "tag": "MORZE" }, { "id": 500140798, "tag": "SEEYA" },
  { "id": 500165687, "tag": "BH34" }, { "id": 500165034, "tag": "-ZUS-" },
  { "id": 500161119, "tag": "FSO" }, { "id": 500202435, "tag": "ZMORA" },
  { "id": 500241735, "tag": "CREDO" }, { "id": 500148567, "tag": "GRAY" },
  { "id": 500217436, "tag": "CMWR" }, { "id": 500164952, "tag": "ST0RM" },
  { "id": 500225088, "tag": "FCY" }, { "id": 500199605, "tag": "PZPR" },
  { "id": 500156476, "tag": "NEON" }, { "id": 500189446, "tag": "SH0W" },
  { "id": 500205563, "tag": "MCNC" }, { "id": 500197553, "tag": "F-C-P" },
  { "id": 500155808, "tag": "YOGA" }, { "id": 500146927, "tag": "PUNKS" },
  { "id": 500220997, "tag": "GR0M" }, { "id": 500186557, "tag": "YERBA" },
  { "id": 500157278, "tag": "B-EYE" }, { "id": 500183711, "tag": "ORPBL" },
  { "id": 500164984, "tag": "LUZAK" }, { "id": 500180912, "tag": "KO_50" },
  { "id": 500190749, "tag": "STZPL" }, { "id": 500246335, "tag": "-SG1-" },
  { "id": 500226453, "tag": "RFOX" }, { "id": 500228208, "tag": "MROK" },
  { "id": 500139958, "tag": "JEDI" }, { "id": 500171946, "tag": "-M-W-" },
  { "id": 500210732, "tag": "KNUR" }, { "id": 500238363, "tag": "CMWR2" },
  { "id": 500158182, "tag": "MAX" }, { "id": 500217832, "tag": "-AZG-" },
  { "id": 500153011, "tag": "QTAZ" }, { "id": 500173585, "tag": "-WIR-" },
  { "id": 500139775, "tag": "SOK" }, { "id": 500164815, "tag": "KOTST" },
  { "id": 500165022, "tag": "ZMZ" }, { "id": 500173779, "tag": "CYRK" },
  { "id": 500155866, "tag": "RR1" }, { "id": 500221231, "tag": "AMEBY" },
  { "id": 500151512, "tag": "GHOST" }, { "id": 500190928, "tag": "WOJPL" },
  { "id": 500176873, "tag": "EPMW" }, { "id": 500246592, "tag": "-STP-" },
  { "id": 500223055, "tag": "P_MW" }, { "id": 500219192, "tag": "WRONA" },
  { "id": 500193003, "tag": "AGAMA" }, { "id": 500195605, "tag": "SCREW" },
  { "id": 500160564, "tag": "SBP" }, { "id": 500205640, "tag": "OFFNN" },
  { "id": 500241825, "tag": "WWNC" }, { "id": 500196915, "tag": "GHUND" },
  { "id": 500156004, "tag": "WBPM" }, { "id": 500199666, "tag": "KOFTS" },
  { "id": 500185519, "tag": "E-BOJ" }, { "id": 500227046, "tag": "SD-22" },
  { "id": 500212434, "tag": "OUTPL" }, { "id": 500200755, "tag": "WLVS-" },
  { "id": 500219967, "tag": "CRED0" }, { "id": 500163307, "tag": "FULL" },
  { "id": 500177145, "tag": "-REB-" }, { "id": 500140534, "tag": "MIRKO" },
  { "id": 500184409, "tag": "40_PL" }, { "id": 500213188, "tag": "RNG-1" },
  { "id": 500224913, "tag": "S-A-O" }, { "id": 500211845, "tag": "PWNW" },
  { "id": 500249298, "tag": "MASSA" }, { "id": 500240258, "tag": "PKWN" },
  { "id": 500154408, "tag": "PIO" }, { "id": 500212878, "tag": "P_I_B" },
  { "id": 500242304, "tag": "THOR-" }, { "id": 500229257, "tag": "F11" },
  { "id": 500249280, "tag": "INT-M" }, { "id": 500221327, "tag": "FROGS" }
];

async function pobierzDane() {
  const wyniki = [];
  const idsString = polskieKlany.map(c => c.id).join(',');
  const url = `https://worldofwarships.eu{WG_APP_ID}&clan_id=${idsString}&extra=clan_battles`;

  try {
    const res = await fetch(url);
    const apiData = await res.json();

    if (apiData.status !== 'ok' || !apiData.data) {
      console.error("Błąd odpowiedzi API");
      return;
    }

    polskieKlany.forEach(klan => {
      const info = apiData.data[klan.id];
      if (!info) return;

      const cb = info.clan_battles;
      let b = 0, w = 0, ralkowity = 0;

      // Sprawdzamy czy w strukturze jest zapis z trwającego lub przeszłego sezonu
      if (cb) {
        if (Array.isArray(cb.ratings) && cb.ratings.length > 0) {
          const rObj = cb.ratings[0];
          b = rObj.battles_count || 0;
          w = rObj.wins_count || 0;
          ralkowity = rObj.public_rating || 0;
        } else if (cb.past_seasons && typeof cb.past_seasons === 'object') {
          const sIds = Object.keys(cb.past_seasons).map(Number).sort((x, y) => y - x);
          const ostId = sIds[0];
          if (ostId && cb.past_seasons[ostId]) {
            const rObj = cb.past_seasons[ostId];
            if (Array.isArray(rObj.ratings) && rObj.ratings.length > 0) {
              b = rObj.ratings[0].battles_count || 0;
              w = rObj.ratings[0].wins_count || 0;
              ralkowity = rObj.ratings[0].public_rating || 0;
            } else {
              b = rObj.battles_count || 0;
              w = rObj.wins_count || 0;
              ralkowity = rObj.public_rating || 0;
            }
          }
        }
      }

      // Rezerwowe przypisanie podstawowego ratingu, jeśli zagnieżdżona struktura klanu była pusta
      if (ralkowity === 0 && info.public_rating) ralkowity = info.public_rating;
      if (b === 0 && info.battles_count) b = info.battles_count;
      if (w === 0 && info.wins_count) w = info.wins_count;

      wyniki.push({
        id: klan.id,
        tag: info.tag || klan.tag,
        nazwa: info.name || klan.tag,
        sezon: cb?.season_id || 33,
        bitwy: b,
        wygrane: w,
        wr: b > 0 ? Number(((w / b) * 100).toFixed(2)) : 0,
        rating_calkowity: ralkowity,
        liga: 4,
        dywizja: 3,
        punkty: ralkowity > 0 ? (ralkowity % 100) : 0
      });
    });

    fs.mkdirSync('./public', { recursive: true });
    fs.writeFileSync('./public/wyniki.json', JSON.stringify(wyniki, null, 2));
    console.log(`Zapisano pomyślnie pliki dla ${wyniki.length} klanów.`);

  } catch (err) {
    console.error("Błąd sieci:", err.message);
  }
}

pobierzDane();
