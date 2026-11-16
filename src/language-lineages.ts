import {esc} from './dom';
export interface LanguageFamily {id:string;name:string;url:string;members:{id:string;name:string;path?:string}[]}
const family=(id:string,name:string,members:[string,string,string?][]):LanguageFamily=>({id,name,url:`https://glottolog.org/resource/languoid/id/${id}`,members:members.map(([id,name,path])=>({id,name,path}))});
/** Selected classification facts from Glottolog, CC BY 4.0; no modern positions used. */
export const languageFamilies:LanguageFamily[]=[
 family('indo1319','Indo-European',[
  ['stan1288','Spanish','Romance · descended from spoken Latin'],['port1283','Portuguese','Romance · descended from spoken Latin'],['stan1290','French','Romance · descended from spoken Latin'],['stan1293','English','Germanic'],['dutc1256','Dutch','Germanic'],['russ1263','Russian','Slavic'],
 ]),
 family('aust1307','Austronesian',[
  ['hawa1245','Hawaiian','Oceanic → Polynesian'],['tahi1242','Tahitian','Oceanic → Polynesian'],['rapa1244','Rapanui','Oceanic → Polynesian'],
 ]),
 family('eski1264','Inuit–Yupik–Unangan',[
  ['east2534','Eastern Canadian Inuktitut','Inuit branch'],['kala1399','Kalaallisut','Inuit branch'],
 ]),
 family('atha1245','Athabaskan–Eyak–Tlingit',[
  ['nava1243','Diné Bizaad / Navajo','Athabaskan'],['tlin1245','Tlingit'],
 ]),
 family('algi1248','Algic',[
  ['wamp1249','Massachusett / Wampanoag','Algonquian'],
 ]),
 family('iroq1247','Iroquoian',[
  ['wend1234','Wendat'],['moha1258','Kanien’kéha / Mohawk'],
 ]),
 family('miwo1274','Miwok–Costanoan',[
  ['muts1243','Mutsun'],
 ]),
 family('utoa1244','Uto-Aztecan',[
  ['clas1250','Classical Nahuatl'],
 ]),
 family('maya1287','Mayan',[
  ['kaqc1270','Kaqchikel'],['chol1282','Ch’ol'],['tzot1259','Tzotzil'],['yuca1254','Yucatec Maya'],
 ]),
 family('quec1387','Quechuan',[
  ['cusc1236','Cusco Quechua'],['clas1251','Classical Quechua (catalog category)'],
 ]),
 family('ayma1253','Aymaran',[
  ['cent2142','Central Aymara'],['sout2996','Southern Aymara'],
 ]),
 family('tupi1275','Tupian',[
  ['tupi1273','Tupinambá'],['para1311','Paraguayan Guaraní'],
 ]),
 family('sali1297','Saliban',[
  ['sali1298','Sáliba'],
 ]),
 family('arau1255','Araucanian',[
  ['mapu1245','Mapudungun'],
 ]),
];
export function languageLineagesHTML():string{
 return `<section class="language-lineages"><h3>Roots &amp; relatives</h3><p>A selected family forest, independent of the movie date. These are linguistic relationships, not a map of ancestry or political identity. Intermediate branches omitted unless named.</p>${languageFamilies.map(f=>`<details class="language-family"><summary>${esc(f.name)}</summary><a href="${f.url}" target="_blank" rel="noopener">Classification &amp; references ↗</a><ul>${f.members.map(m=>`<li>${m.path?`<small>${esc(m.path)} →</small>`:''}<a href="https://glottolog.org/resource/languoid/id/${m.id}" target="_blank" rel="noopener">${esc(m.name)}</a></li>`).join('')}</ul></details>`).join('')}<details><summary>Unresolved roots and isolated languages</summary><p>Zuni is classified as an isolate: no established genealogical relationship to another language is demonstrated by that classification. An isolate still has a history.</p><a href="https://glottolog.org/resource/languoid/id/zuni1245" target="_blank" rel="noopener">Zuni classification ↗</a><p>Dene–Yeniseian is a debated long-range proposal. The map does not join all American languages into “Amerind,” or treat genetic similarity as proof of speech.</p><a href="#review/language-dene-yeniseian-beringia-model">Read the proposal and limits ↗</a></details><details><summary>Contact is not descent</summary><p>Languages can borrow words and structures while retaining different family histories. Bilingual communities, trade languages and creoles need contact histories as well as family trees. Hawaiian did not turn into English: Hawaiʻi Creole developed in a multilingual society, with English as its principal vocabulary source and contributions from several languages.</p><a href="https://www.hawaii.edu/satocenter/langnet/definitions/hce.html" target="_blank" rel="noopener">University of Hawaiʻi: Hawaiʻi Creole ↗</a></details><p class="fine">Selected names and classification facts: Glottolog, Hammarström, Forkel, Haspelmath and Bank · CC BY 4.0. Catalog consulted November 2026. Some catalog headings use older terminology; the Inuit–Yupik–Unangan label is used here for the family cataloged as “Eskimo–Aleut.” Modern catalog coordinates were not used to draw historical distributions.</p></section>`;
}
