/*  This script will download all images found on the specified webpage to a downloads directory within your project folder. 
    Ensure you have this downloads directory created before running the script, or modify the script to create the directory if it doesn't exist.
*/
import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrape_bargains(page_url){
    try {
        const res = await axios.get(page_url);
        const $ = cheerio.load(res.data);

        // Find "window.staticSettings = { ... }" in the HTML 
        const match = $.html().match(/window\.staticSettings\s*=\s*({.*?});/s);
        if (!match) return;

        // Find staticSettings, and parse to JSON
        const staticSettings_raw = match[1];
        const staticSettings = JSON.parse(staticSettings_raw);
        
        // Relevant text
        const page_texts = staticSettings.pageTexts;
        //console.log(page_texts);

        let price_found = false;
        //let prev_found_price = false;
        let unit_prices_found = false;
        let prev_unit_price_found = true;
        let prev_product_name_found = true;

        const all_bargains = {
            name: [],
            amount: [],
            unit: [],
            unit_to_price: [],
            unit_price: [],
            price: []
        };

        let product_num = -1;

        page_texts.forEach(page => {
            const corrected_prices = page.replace(/(\d+) 95 /g, '$1,95,- ');
            const product = corrected_prices.split(/(?<=,-)|Avisen gælder/);
        //console.log(product);

            const filtered = product
                .filter(str => str.includes(',-') && !str.includes('føtex Plus appen') || str.includes('g.'))
                /*.filter(str => {
                    const s = str.trim();
                    return !(s === '' || /^[\d\s.,-]+$/.test(s));
                })*/
                .map(str => str.trimStart());/*
                    .replace(/Flere varianter\.|Udenlandske\.|Udenlandsk.|Skarp Pris /gi, '')
                    .replace(/\s{2,}/g, ' ')
                );*/
            
            //console.log(filtered);

            
            filtered.forEach(product => {
                // Get the first word of the product name
                let capital_words = product.match(/\p{Lu}\p{L}*/gu);
                const unusable_words = new Set(['Plus', 'Gælder', 'Pr', 'Nyt', 'Ikke', 'Flere', 'Skarp', 'Spar', 'Pris', 'Månedens', 'Søndagspris', 'Hybrid', 'PFAS', 'FRI', 'Grillhygge', 'Sommeraften', 'Inspiration', 'Stort', 'Husk', 'Min']);
//console.log('ordet: ', capital_words);
                let word_of_first_product = null;

                if (capital_words !== null){
                    word_of_first_product = capital_words.find(word => !unusable_words.has(word) && word.length <= 20);
                }
                //console.log('first word:',word_of_first_product);
                /*for(let i = 0; i < capital_words.length; i++){
                    for(let j = 0; j < unusable_words.length; j++){
                        if (capital_words[i] === unusable_words[j] || capital_words[i].length > 20){ // MAX limit "20" carecter for first word
                            word_of_first_product = null;
//console.log('fjerner elemetet, nu:', word_of_first_product);
                            break;
                        } else {
                            word_of_first_product = capital_words[i];
//console.log(word_of_first_product);
                        }
                    }

                    if (word_of_first_product){
                        break;
                    }
                }*/
//console.log('tilbud på siden: ', word_of_first_product);

                // Fill in the rest of the product name
                if (word_of_first_product){
                    product_num++;
                    /*
                    if(prev_found_price) {
console.log('sætter til "true" pga. prev_found_price er: ', prev_found_price);
                        price_found = true;
                    } else {
                        price_found = false;
                    }
                    prev_found_price = false;*/
//console.log('found unit price: ',unit_prices_found, prev_unit_price_found)
                    if(unit_prices_found){
                        prev_unit_price_found = true
                    } else {
                        prev_unit_price_found = false
                    }
                    price_found = false;
                    unit_prices_found = false;
                    const index_of_word = product.indexOf(word_of_first_product);
//console.log('index of word:', index_of_word);
                    const product_name_start = product.slice(index_of_word);

                    if(!prev_product_name_found){
                        const before_new_propduct_name = product.slice(0,index_of_word);
//console.log('before_new_propduct_name: ', before_new_propduct_name);
                        const rest_product_name_match = before_new_propduct_name.match(/(.+?)\s(\d+(?:,\d+)?(?:-\d+(?:,\d+)?)?)\s?(g\.|kg\.|ml\.|cl\.)/i);
                        if(rest_product_name_match){
                            prev_product_name_found = true;
                            const rest_product_name = rest_product_name_match[1].trim();
                            const amount = rest_product_name_match[2].trimEnd();
                            const unit = rest_product_name_match[3].trimEnd(); 
                            //console.log('rest_of_propduct_name: ', rest_product_name);
                            //console.log('Amount and unit: ', amount, unit);
                            const index_prev_name = all_bargains.name.length - 1;
                            all_bargains.name[index_prev_name] += " " + rest_product_name;
                            //temp_unit = unit;
                            //temp_amount = amount;
                            all_bargains.unit[product_num] = unit;
                            all_bargains.amount[product_num] = amount;
                        }
                    }

                    // Stop when detect a number with a unit = compleat prodct_name, if end whit a number follows by ,-, the product_name is unfinneshed
//console.log('start name: ',capital_words);
                    let product_name_match = product_name_start.match(/(.+?)\s(\d+(?:,\d+)?(?:x\d+)?(?:-\d+(?:,\d+)?)?)\s?(g|kg|ml|cl|rl|liter|stk)/i);
                    let product_name, amount, unit, filter_name = 'Normal';
                    if (!product_name_match) {
                        product_name_match = product_name_start.match(/^(.+?)\s+([A-Z0-9]{1,4}(?:-[A-Z0-9]{1,4})?)\./i); // Clothes size eg. XS-XXL
                        filter_name = 'Clothes size';
                        if (!product_name_match){
//console.log('match product name: ',product_name_start);
                            product_name_match = product_name_start.match(/^((?:\b\p{L}+\b\s+)*)(\b\p{L}+\b)\s+\2\b/iu); // Dublicate of words
                            filter_name = '2x words';
                            if(!product_name_match){
                                product_name_match = product_name_start.match(/(\p{Lu}[\p{L}\d\s\-]*)\s+Med/iu); // Stop at "Med"
                                filter_name = 'Stop at "Med"';
                                if(!product_name_match){
                                    product_name_match = product_name_start.match(/^(.+?)\s+Flere/i); // Stop at "Flere"
                                    filter_name = 'Stop at "Flere"';
//console.log('Check med navnet gentagelse: ',product_name_match);
                                    if(!product_name_match){
                                        const first_part_of_product_name = product_name_start.match(/(.+?)\s(\d+(?:,\d+)?)\s?,-/i);
                                        if(first_part_of_product_name){
                                            prev_product_name_found = false;
                                            //console.log('Misssing some of name: ', first_part_of_product_name[1]);
                                            all_bargains.name[product_num] = first_part_of_product_name[1];
                                        }
                                    }
                                }
                            } else {
                                product_name = product_name_match[1] + product_name_match[2];
                            }
                        }
                    }
                    if(product_name_match){
//console.log('Chosen Filter: ', filter_name);
                        if(!product_name){
                            product_name = product_name_match[1].trimEnd();
                            if(product_name_match[2] && !unusable_words.has(product_name_match[2])){
                                amount = product_name_match[2].trimEnd();
                            }
                        }
                        if(product_name_match[3]){
                            unit = product_name_match[3].trimEnd();
                        }

                        // Pålægsmarked
                        if(product_name[product_name.length-1] === '*'){
                            //console.log('product_name ends on a star (*)');
                            const new_product_name = product_name.match(/\b[A-ZÆØÅÖÜ][a-zæøåöüA-ZÆØÅÖÜ]*\b/g);
                            if(new_product_name){
                                product_name = new_product_name[1];
                            }
                        }

                        // Drikkevaremarked or Salling frostmarked
                        if(product_name === 'Drikkevaremarked' || product_name === 'Salling frostmarked' || product_name.includes('Frugtmarked')){
//console.log(capital_words, word_of_first_product);
                            for (let i = 0; i <= capital_words.length; i++){
                                if(word_of_first_product === capital_words[i]){
                                    for(let j = i + 1; j < i + 4 && j < capital_words.length; j++){
                                        if(!unusable_words.has(capital_words[j])){
                                            word_of_first_product = capital_words[j];
                                            break;
                                        }
                                    }
                                    break;
                                }
                            }
//console.log('new first word: ',word_of_first_product);
                            const index_of_word = product.indexOf(word_of_first_product);
                            const product_name_start = product.slice(index_of_word);
                            const product_name_match = product_name_start.match(/^.*?(?=\.)/);
                            
                            if(product_name_match){
//console.log('new_product_name: ', product_name_match);
                                product_name = product_name_match[0];
                            }
                        }
                        
                        //console.log('Full name of the product: ', product_name.replace(/\s*eller\s*/g, ', '));
                        all_bargains.name[product_num] = product_name.replace(/\s*eller\s*/g, ', ');
                        if(product_name !== 'Øl- eller sodavandsmarked' && amount !== undefined){
                            if(unit === undefined){
                                //console.log('Amount: ', amount);
                            } else {
                                //console.log('Amount and unit: ', amount, unit);
                                all_bargains.unit[product_num] = unit;
                            }
                            all_bargains.amount[product_num] = amount;
                        }
                    }
                }

                // Find the product price
//console.log('status on price_found: ',price_found)
                if (!price_found){
                    let price = 0;                   
//console.log('prisen: ',price);
                    const end_price_index = product.indexOf(',-');
                    const space_index = product.lastIndexOf(" ", end_price_index);
                    price = product.slice(space_index+1, end_price_index);
                    const before_price = product.slice(space_index - 15, space_index);
//console.log('before_price: ', before_price);
                    if(/(Pr\.?\s?(kg|kg max\.|liter|liter max\.|stk|stk\.|til))[^0-9]*$/i.test(before_price)){
//console.log('status on unwanted: ', /(Pr\.?\s?(kg|kg max\.|liter|liter max\.|stk|stk\.|til))[^0-9]*$/i.test(before_price));
                        price_found = false;
                    } else {
                        price_found = true;
                    }
//console.log('Prisen på grisen: ', price);
                    if(price !== 0 && price_found && price.length < 10){
                        //console.log('price: ', price);
                        all_bargains.price[product_num] = Number(price.replace(',', '.'));
                        if (word_of_first_product === null){
                            //prev_found_price = true;
//console.log('Setting prev_found_price till: true');
                        }
                    }
                }

                // Find kg or L price
                if(!prev_unit_price_found){
                    const unit_prices = ['Pr. kg max.', 'Pr. kg', 'Pr. liter max.', 'Pr. liter', 'Pr. stk.', 'Pr stk.'];
//console.log('Check if match found (before: ');
                    for (let i = 0; i <= unit_prices.length; i++){
                        if(!product.includes(unit_prices[i])){
                            continue;
                        }
                        
                        const unit_to_price = unit_prices[i];
                        const index_unit_price = product.indexOf(unit_to_price);
                        const index_of_word = product.indexOf(word_of_first_product);

//console.log('brfore_unit_price before product_name: ',index_of_word < index_unit_price);
                        if (index_of_word < index_unit_price){
                            continue;
                        }

                        const rest_of_text = product.slice(index_unit_price + unit_to_price.length);
                        const match_price = rest_of_text.match(/\d+(,\d+)?/);

                        if (match_price){
//console.log(match_price);
                            prev_unit_price_found = true;
                            let price = match_price[0].trimStart();
                            //console.log(unit_to_price, ': ', price);

                            const index_prev_unit_to_price = all_bargains.unit_to_price.length - 1;
                            const index_prev_unit_price = all_bargains.unit_price.length - 1;
                            all_bargains.unit_to_price[index_prev_unit_to_price] = unit_to_price;
                            all_bargains.unit_price[index_prev_unit_price] = price.replace(',', '.');
                            break;
                        }
                    }
                }


//console.log('Status on unit_prices_found: ', unit_prices_found);
                if (!unit_prices_found){
                    const unit_prices = ['Pr. kg max.', 'Pr. kg', 'Pr. liter max.', 'Pr. liter', 'Pr. stk.', 'Pr stk.'];
                    for (let i = 0; i <= unit_prices.length; i++){
//console.log('Check if match found: ');
                        if(!product.includes(unit_prices[i])){
                            continue;
                        }
                        
                        const unit_to_price = unit_prices[i];
                        const index_first_unit_price = product.indexOf(unit_to_price);
                        const index_last_unit_price = product.lastIndexOf(unit_to_price);
                        const index_of_word = product.indexOf(word_of_first_product);
                        let index_unit_price = 0;
//console.log('unit_price before product_name: ',index_of_word > index_unit_price);
                        if (index_first_unit_price === index_last_unit_price && index_of_word < index_first_unit_price){
                            index_unit_price = index_first_unit_price;
                        } else if (index_of_word < index_last_unit_price){
                            index_unit_price = index_last_unit_price;
                        } else {
                            continue;
                        }

                        const rest_of_text = product.slice(index_unit_price + unit_to_price.length);
                        const match_price = rest_of_text.match(/\d+(,\d+)?/);

                        if (match_price){
//console.log(match_price);
                            unit_prices_found = true;
                            let price = match_price[0].trimStart();
                            //console.log(unit_to_price, ': ', price);
                            all_bargains.unit_to_price[product_num] = unit_to_price;
                            all_bargains.unit_price[product_num] = price.replace(',', '.');
                            break;
                        }
                    }
                }
            });
        });

        // Insert in DB
        console.log('Number of bargains:', all_bargains.name.length);
        return all_bargains;

    } catch (error) {
        console.error(error);
    }
};

export { scrape_bargains };
//scrape_bargains('https://avis.foetex.dk/naeste-uges-avis/'); // Replace with the URL of the site you want to scrape