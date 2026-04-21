import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import os

#https://medium.com/@logan.laszewski14/learning-web-scraping-by-tracking-pok%C3%A9mon-card-prices-30d97a8f5eeb
#run this file to produce csv with card data

sealed_product_keywords = [
    "booster pack","booster box","elite trainer box","etb","display box",
    "factory sealed","blister","theme deck","starter deck","pokemon tin",
    "promo set","bundle","collection"
]

sealed_product_pattern = '|'.join(sealed_product_keywords)

PRICECHARTING_BASE_URL = "https://www.pricecharting.com"

http_headers = {"User-Agent": "Mozilla/5.0"}

games = [
    {
        "category_url": f"{PRICECHARTING_BASE_URL}/category/pokemon-cards",
        "console_prefix": "/console/pokemon",
        "game_name": "Pokémon",
        "set_prefix": "pokemon-",
        "output_file": "pokemon_card_price_data.csv",
        "exclude_patterns": ["japanese"],
        "max_sets": 10
    },
    {
        "category_url": f"{PRICECHARTING_BASE_URL}/category/magic-cards",
        "console_prefix": "/console/magic",
        "game_name": "Magic: The Gathering",
        "set_prefix": "magic-",
        "output_file": "mtg_card_price_data.csv",
        "exclude_patterns": [],
        "max_sets": 10
    },
    {
        "category_url": f"{PRICECHARTING_BASE_URL}/category/yugioh-cards",
        "console_prefix": "/console/yugioh",
        "game_name": "Yu-Gi-Oh",
        "set_prefix": "yugioh-",
        "output_file": "ygo_card_price_data.csv",
        "exclude_patterns": [],
        "max_sets": 10
    }
]

for game in games:
    print(f"Retrieving {game['game_name']} set list...")

    category_page_response = requests.get(game["category_url"], headers=http_headers)
    category_page_soup = BeautifulSoup(category_page_response.text, "html.parser")

    set_links = category_page_soup.select(f'a[href^="{game["console_prefix"]}"]')
    set_urls = list(set(
        PRICECHARTING_BASE_URL + link["href"] for link in set_links
    ))

    for pattern in game["exclude_patterns"]:
        set_urls = [url for url in set_urls if pattern not in url.lower()]

    set_urls = set_urls[:game["max_sets"]]

    card_records = []

    print(f"Found {len(set_urls)} {game['game_name']} sets. Beginning card scrape...")

    for set_page_url in set_urls:

        try:
            sorted_set_url = f"{set_page_url}?sort=highest-price"

            set_page_response = requests.get(sorted_set_url, headers=http_headers)
            set_page_soup = BeautifulSoup(set_page_response.text, "html.parser")

            card_table_rows = set_page_soup.select("table tr")

            for card_row in card_table_rows:

                card_columns = card_row.find_all("td")

                if len(card_columns) >= 5:

                    image_tag = card_columns[0].find("img")
                    card_image_url = image_tag["src"] if image_tag else ""

                    card_name = card_columns[1].text.strip()
                    ungraded_price_text = card_columns[2].text.strip().replace("$","").replace(",","")
                    psa9_price_text = card_columns[3].text.strip().replace("$","").replace(",","")
                    psa10_price_text = card_columns[4].text.strip().replace("$","").replace(",","")

                    card_records.append({
                        "Card_Set": set_page_url.split("/")[-1],
                        "Card_Name": card_name,
                        "Ungraded_Price": ungraded_price_text,
                        "PSA9_Price": psa9_price_text,
                        "PSA10_Price": psa10_price_text,
                        "Card_Image_URL": card_image_url
                    })

        except Exception as scrape_error:
            print(f"Error scraping {set_page_url}: {scrape_error}")

        time.sleep(0.3)

    cards_dataframe = pd.DataFrame(card_records)

    cards_dataframe["Clean_Card_Name"] = cards_dataframe["Card_Name"].str.strip()

    cards_dataframe = cards_dataframe[
        ~cards_dataframe["Clean_Card_Name"].str.contains(
            sealed_product_pattern, case=False, na=False
        )
    ]

    cards_dataframe = cards_dataframe.drop(columns=["Clean_Card_Name"])

    price_columns = ["Ungraded_Price", "PSA9_Price", "PSA10_Price"]

    for price_column in price_columns:
        cards_dataframe[price_column] = pd.to_numeric(
            cards_dataframe[price_column],
            errors="coerce"
        )

    cards_dataframe["Card_Set"] = cards_dataframe["Card_Set"].str.replace(
        game["set_prefix"], "", regex=False
    )

    cards_dataframe.to_csv(os.path.join(os.path.dirname(__file__), game["output_file"]), index=False)

    print(f"\n{game['game_name']} scraping complete.")
    print(f"Total cards scraped: {len(cards_dataframe)}")
    print(f"Data saved to: {os.path.join(os.path.dirname(__file__), game['output_file'])}")

print("\nAll scraping complete.")