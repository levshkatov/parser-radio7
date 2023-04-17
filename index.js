const axios = require("axios").default;
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require("fs").promises;

const BASIC_URL = `https://radio7.ru/playlist/2021/10/`;

const urls = [];
const songs = [];

for (let day = 1; day < 30; day++) {
  for (let hour = 0; hour < 24; hour++) {
    urls.push(
      `${BASIC_URL}${day < 10 ? `0${day}` : day}/${
        hour < 10 ? `0${hour}` : hour
      }:00`
    );
  }
}

(async function () {
  for await (const [i, url] of urls.entries()) {
    console.log(`Now: ${i} Remain: ${urls.length - i - 1}`);

    try {
      const response = await axios.get(url);
      if (!response.data || response.status > 300) {
        throw new Error(`${response.status} Error`);
      }
      const dom = new JSDOM(response.data);
      songs.push(parsePage(dom.window.document));

      if (i === urls.length - 1) {
        await fs.writeFile(
          `${__dirname}/songs_array.txt`,
          JSON.stringify(Array.from(new Set(songs.flat())))
        );
        await fs.writeFile(
          `${__dirname}/songs.txt`,
          Array.from(new Set(songs.flat())).join("\n")
        );
      }
    } catch (e) {
      console.error(e.message);
    }
  }
})();

function parsePage(document) {
  const arr = [];
  try {
    const list = Array.from(document.querySelectorAll(`ul.alt-play-list li`));
    for (const el of list) {
      title = el.querySelector(`span.title`);
      if (!title) continue;
      title = title.textContent.trim();
      if (!title) continue;
      arr.push(title);
    }
  } catch (e) {
    console.error(e.message);
    return [];
  }
  return arr;
}
