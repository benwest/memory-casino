export interface FilmContent {
  longTitle: string;
  shortTitle: string;
  subtitle: string;
  link?: {
    url: string;
    sourceFilter: string;
    thumbnail: string;
  };
}

export interface Content {
  title: string;
  films: FilmContent[];
  body: string[];
  credits: string[];
}

export const content: Content = {
  title: "MEMORY CASINO",
  films: [
    {
      longTitle: "MEMORY CASINO  PART ONE",
      shortTitle: "PART ONE",
      subtitle: "PLAY [06:05]",
      link: {
        url: "https://player.vimeo.com/external/1150464992.m3u8?s=1b2022d58b01004010d70f08e13b2f52df3c7ceb&logging=false",
        sourceFilter: "MC1",
        thumbnail: "MC1_00000",
      },
    },
    {
      longTitle: "MEMORY CASINO  PART TWO",
      shortTitle: "PART TWO",
      subtitle: "PLAY [01:13]",
      link: {
        url: "https://player.vimeo.com/external/1154196684.m3u8?s=fc73f97690fd2707fbe89b9f717e989221a92bbc&logging=false",
        sourceFilter: "MC2",
        thumbnail: "MC2_00005",
      },
    },
    {
      longTitle: "MEMORY CASINO  PART THREE",
      shortTitle: "PART THREE",
      subtitle: "PLAY [10:34]",
      link: {
        url: "https://player.vimeo.com/external/1208177500.m3u8?s=d172fd9c601e181226627b98c58abb785f6a1293&logging=false",
        sourceFilter: "MC3",
        thumbnail: "MC3_00061",
      },
    },
  ],
  body: [
    `YEAR[:]Redacted[;]PLACE[:]United States of America[;]CONDITION[:]Following the successful introduction of the Voluntary Amnesia Solution into the general population of the United States, underground Silos of Sentience have sprung up across all major cities[.]These illegal Memory Casinos are the only sites that allow users to tap into the Global Memory Membrane`,
    `The MEMORY CASINO holds all human memory and not just the user's[.]Reel Envy has created a generation of addicts who desperately trip into the Membrane, hot to land on a memory of their own life[.]This is one such Silo`,
  ],
  credits: [
    `A film from[:]ONCE DE JULIO[;]Starring[:]JULIAN HUCKLEBY, AG ROJAS and D. GONZALEZ ROJAS[;]Written, Directed & Performed by[:]A.G. ROJAS[;]Executive Producer[:]GRACE CAMPOS[;]Producers[:]DIANDRA ARRIGA, GRACE CAMPOS[;]Cinematographers[:]EDSON REYES, DANI FERNÁNDEZ ABELLÓ[;]1st AC[:]JOSUÉ DURAN[;]2nd AC[:]NICOLAS GUTIÉRREZ[;]Loader[:]CARLOS GRIS`,
    `Music composed by[:] QUR'AN SHAHEED, JAMES WILLIAM BLADES[;]Harpist[:]MAIA HARPER[;]Mixing, Tape Loop, and Production[:]SPENCER HARTLING`,
    `Filmed on Location[:]RESTAURANTE PACHUCA, SANTA MARIA LA RIBERA, CDMX[;]and[:]LA TORRE, LOS ANGELES`,
    `Special Artistic Participation by[:]CONLLOGA MUIXERANGA DE CASTELLÓ in Valencia[;]and[;]LA ESCUELA DEL BALLET FOLKLÓRICO DE MÉXICO DE AMALIA HERNÁNDEZ`,
    `Film Production Serviced by[:]The Production Club (Spain)[;]and[;]The Lift (Mexico)`,
    `Architectural design by[:]A. TEATRO[;]Special Thank You To[:]THE LIFT[;]Website by[:]BEN WEST`,
  ],
};
