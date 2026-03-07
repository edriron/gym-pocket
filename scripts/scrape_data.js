import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import he from "he";
import iconv from "iconv-lite";

const { decode } = he;

const products = [
  "https://www.foodsdictionary.co.il/Products/1/%D7%91%D7%99%D7%A6%D7%94%20%D7%A9%D7%9C%D7%9E%D7%94%20-%20%D7%98%D7%A8%D7%99%D7%94",
  "https://www.foodsdictionary.co.il/Products/1/%D7%91%D7%A0%D7%A0%D7%94",
  "https://www.foodsdictionary.co.il/Products/5/%D7%A4%D7%A8%D7%95%D7%A1%D7%95%D7%AA%20%D7%A2%D7%9E%D7%A7%2028%25%20%D7%A9%D7%95%D7%9E%D7%9F",
  "https://www.foodsdictionary.co.il/Products/63/%D7%90%D7%95%D7%A8%D7%96%20%D7%99%D7%A1%D7%9E%D7%99%D7%9F%20%D7%A7%D7%9C%D7%90%D7%A1%D7%99",
  "https://www.foodsdictionary.co.il/Products/34/%D7%A4%D7%AA%D7%99%D7%AA%D7%99%D7%9D%20%D7%90%D7%A4%D7%95%D7%99%D7%99%D7%9D%20%D7%91%D7%A6%D7%95%D7%A8%D7%AA%20%D7%A7%D7%95%D7%A1%D7%A7%D7%95%D7%A1",
  "https://www.foodsdictionary.co.il/Products/1/%D7%9E%D7%9C%D7%A4%D7%A4%D7%95%D7%9F%20%D7%A2%D7%9D%20%D7%A7%D7%9C%D7%99%D7%A4%D7%94",
  "https://www.foodsdictionary.co.il/Products/1/%D7%A2%D7%92%D7%91%D7%A0%D7%99%D7%94",
  "https://www.foodsdictionary.co.il/Products/1/%D7%A4%D7%9C%D7%A4%D7%9C%20%D7%90%D7%93%D7%95%D7%9D",
  "https://www.foodsdictionary.co.il/Products/1/%D7%97%D7%A1%D7%94%20%D7%A2%D7%A8%D7%91%D7%99%D7%AA",
  "https://www.foodsdictionary.co.il/Products/1/%D7%91%D7%A6%D7%9C",
  "https://www.foodsdictionary.co.il/Products/1/%D7%91%D7%A6%D7%9C%20%D7%A1%D7%92%D7%95%D7%9C",
  "https://www.foodsdictionary.co.il/Products/81/%D7%98%D7%97%D7%99%D7%A0%D7%94%20100%25%20%D7%A9%D7%95%D7%9E%D7%A9%D7%95%D7%9D%20%D7%98%D7%94%D7%95%D7%A8",
];

function normalizeNumber(value) {
  if (!value) return null;

  const cleaned = value.replace(",", ".").replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned);

  return isNaN(num) ? null : num;
}

function parseNutritionTable($) {
  function getValue(id) {
    const el = $("#" + id);

    if (!el.length) return null;

    const raw =
      el.attr("data-start") ||
      el.find("[data-start]").attr("data-start") ||
      el.text();

    return normalizeNumber(raw);
  }

  return {
    calories: getValue("currentValue0"),
    protein_g: getValue("currentValue1"),
    carbs_g: getValue("currentValue2"),
    fats_g: getValue("currentValue4"),
  };
}

function extractProductName($) {
  const title = $("h1").first().text().trim();
  return decode(title);
}

async function scrapeProduct(url) {
  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      timeout: 10000,
    });

    const html = iconv.decode(res.data, "windows-1255");
    const $ = cheerio.load(html);

    const name = extractProductName($);
    const nutrition = parseNutritionTable($);

    return {
      name,
      source_url: url,
      serving_basis: "100g",
      ...nutrition,
    };
  } catch (err) {
    console.error("Failed to scrape:", url);
    return null;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const results = [];

  for (const url of products) {
    console.log("Scraping:", url);

    const data = await scrapeProduct(url);

    if (data) results.push(data);

    await sleep(1500);
  }

  fs.writeFileSync(
    "foods_temp.json",
    JSON.stringify(results, null, 2),
    "utf-8",
  );

  console.log("Saved foods_temp.json");
}

run();
