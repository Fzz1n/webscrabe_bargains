import axios from 'axios';
import * as cheerio from 'cheerio';
import { inflate } from 'zlib';

async function scrape_bargains(page_url){
    try {
        const res = await axios.get(page_url);
        const $ = cheerio.load(res.data);

        // Find "window.staticSettings = { ... }" in the HTML 
        const match = $.html().match(/window\.staticSettings\s*=\s*({.*?});/s);
        if(!match) {
            return;
        }
        // Find staticSettings, and parse to JSON
        const staticSettings_raw = match[1];
        const staticSettings = JSON.parse(staticSettings_raw);
        
        // Relevant text
        const page_texts = staticSettings.pageTexts;

        let price_found = false;
        let unit_prices_found = false;
        let prev_unit_price_found = true;
        let prev_product_name_found = true;

        const all_bargains = {
            name: [],
            amount: [],
            min_amount: [],
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
                .map(str => str.trimStart());
//console.log(filtered);
            filtered.forEach(product => {
                // Skip line
                if(product.includes('Dagspriser') || product.includes('føtex Delikatessen')){
                    return;
                }

                // Get the first word of the product name
                let capital_words = product.match(/\p{Lu}\p{L}*/gu);
                const unusable_words = new Set(['Plus', 'Gælder', 'Pr', 'Nyt', 'Ny', 'Ikke', 'Flere', 'Skarp', 'Spar', 'Pris', 'Månedens', 'Søndagspris', 'Hybrid', 'PFAS', 'FRI', 'Grillhygge', 'Sommeraften', 'Inspiration', 'Stort', 'Husk', 'Min', 'Smørrebrød', 'Torsdag', 'Sælges', 'Nem', 'Til', 'Det', 'Mere', 'Smagen', 'Aftensmad', 'Ret', 'Simpel', 'Maks', 'Velbekomme', 'Find', 'Se', 'Ugens', 'Så', 'Særligt', 'Derfor']);

                let word_of_first_product = null;

                if(capital_words !== null){
                    word_of_first_product = capital_words.find(word => !unusable_words.has(word) && word.length <= 13);
                }

                // Fill in the rest of the product name
                if(word_of_first_product){
                    product_num++;

                    if(unit_prices_found){
                        prev_unit_price_found = true
                    } else {
                        prev_unit_price_found = false
                    }

                    price_found = false;
                    unit_prices_found = false;
                    const index_of_word = product.indexOf(word_of_first_product);
                    const product_name_start = product.slice(index_of_word);

                    if(!prev_product_name_found){
                        const before_new_propduct_name = product.slice(0,index_of_word);
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
                            all_bargains.unit[product_num] = unit;
                            all_bargains.amount[product_num] = amount;
                            all_bargains.min_amount[product_num] = find_min_amount(amount, unit);
                        }
                    }

                    // Stop when detect a number with a unit = compleat prodct_name, if end whit a number follows by ,-, the product_name is unfinneshed
                    let product_name_match = product_name_start.match(/(.+?)\s(\d+(?:,\d+)?(?:x\d+)?(?:-\d+(?:,\d+)?)?)\s?(g|kg|ml|cl|rl|liter|stk)/i);
                    let product_name, amount, unit, filter_name = 'Normal';

                    if (!product_name_match) {
                        product_name_match = product_name_start.match(/^(.+?)\s+([A-Z0-9]{1,4}(?:-[A-Z0-9]{1,4})?)\./i); // Clothes size eg. XS-XXL
                        filter_name = 'Clothes size';

                        if (!product_name_match){
                            product_name_match = product_name_start.match(/^((?:\b\p{L}+\b\s+)*)(\b\p{L}+\b)\s+\2\b/iu); // Dublicate of words
                            filter_name = '2x words';

                            if(!product_name_match){
                                product_name_match = product_name_start.match(/(\p{Lu}[\p{L}\d\s\-]*)\s+Med/iu); // Stop at "Med"
                                filter_name = 'Stop at "Med"';

                                if(!product_name_match){
                                    product_name_match = product_name_start.match(/^(.+?)\s+Flere/i); // Stop at "Flere"
                                    filter_name = 'Stop at "Flere"';

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
//console.log('\nChosen Filter: ', filter_name);

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
                            const new_product_name = product_name.match(/\b[A-ZÆØÅÖÜ][a-zæøåöüA-ZÆØÅÖÜ]*\b/g);

                            if(new_product_name){
                                product_name = new_product_name[1];
                            }
                        }

                        // Drikkevaremarked or Salling frostmarked
                        if(product_name === 'Drikkevaremarked' || product_name === 'Salling frostmarked' || product_name.includes('Frugtmarked')){
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
                            const index_of_word = product.indexOf(word_of_first_product);
                            const product_name_start = product.slice(index_of_word);
                            let product_name_match;

                            if(product_name === 'Drikkevaremarked'){
                                product_name_match = product_name_start.split('. Flere');
                            } else {
                                product_name_match = product_name_start.match(/^.*?(?=\.)/);
                            }
                            
                            if(product_name_match){
//console.log('new_product_name: ', product_name_match);
                                product_name = product_name_match[0];
                            }
                        }
                        
//console.log('Full name of the product: ', product_name);
                        all_bargains.name[product_num] = product_name;

                        if(product_name !== 'Øl- eller sodavandsmarked' && amount !== undefined){

                            if(unit !== undefined){
//console.log('Amount and unit: ', amount, unit);
                                all_bargains.unit[product_num] = unit;
                            }
                            all_bargains.amount[product_num] = amount;
                            all_bargains.min_amount[product_num] = find_min_amount(amount, unit);
                        }
                    }
                }

                // Find the product price
                if (!price_found){
                    let price = 0;                   
                    const end_price_index = product.indexOf(',-');
                    const space_index = product.lastIndexOf(" ", end_price_index);
                    price = product.slice(space_index+1, end_price_index);
                    const before_price = product.slice(space_index - 15, space_index);

                    if(/(Pr\.?\s?(kg|kg max\.|liter|liter max\.|stk|stk\.|til))[^0-9]*$/i.test(before_price)){
                        price_found = false;
                    } else {
                        price_found = true;
                    }

                    if(price !== 0 && price_found && price.length < 10){
//console.log('price: ', price);
                        all_bargains.price[product_num] = Number(price.replace(',', '.'));
                    }
                }

                // Find kg or L price
                if(!prev_unit_price_found){
                    const unit_prices = ['Pr. kg max.', 'Pr. kg', 'Pr. liter max.', 'Pr. liter', 'Pr. stk.', 'Pr stk.'];

                    for (let i = 0; i <= unit_prices.length; i++){
                        if(!product.includes(unit_prices[i])){
                            continue;
                        }
                        
                        const unit_to_price = unit_prices[i];
                        const index_unit_price = product.indexOf(unit_to_price);
                        const index_of_word = product.indexOf(word_of_first_product);

                        if (index_of_word < index_unit_price){
                            continue;
                        }

                        const rest_of_text = product.slice(index_unit_price + unit_to_price.length);
                        const match_price = rest_of_text.match(/\d+(,\d+)?/);

                        if (match_price){
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

                if (!unit_prices_found){
                    const unit_prices = ['Pr. kg max.', 'Pr. kg', 'Pr. liter max.', 'Pr. liter', 'Pr. stk.', 'Pr stk.'];

                    for (let i = 0; i <= unit_prices.length; i++){
                        if(!product.includes(unit_prices[i])){
                            continue;
                        }
                        
                        const unit_to_price = unit_prices[i];
                        const index_first_unit_price = product.indexOf(unit_to_price);
                        const index_last_unit_price = product.lastIndexOf(unit_to_price);
                        const index_of_word = product.indexOf(word_of_first_product);
                        let index_unit_price = 0;

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

        // Numbers of bargains and calc missing: price, amount, unit price
        console.log('Number of bargains:', all_bargains.name.length);        
        const bargains = cal_trilogi(all_bargains);

        // Send to DB
        return bargains;

    } catch (error) {
        console.error(error);
    }
};

// Find minimum amount
function find_min_amount(amount, unit){
    let cal_const = 1, min_amount;
    if(unit === undefined){
        return;
    } else if(unit === 'kg' || unit === 'liter'){
        cal_const = 1000;
    } else if(unit === 'cl'){
        cal_const = 10;
    }

    amount = amount.replace(',', '.');
    if(amount.includes('-')){
        min_amount = Number(amount.slice(0,amount.indexOf('-'))) * cal_const;
    } else if(amount.includes('x')){
        min_amount = Number(amount.slice(amount.indexOf('x')+1)) * cal_const;
    } else if(amount === undefined){
        min_amount = Infinity;
    } else {
        min_amount = Number(amount) * cal_const;
    }

    return min_amount;
}

// Calc missing: price, amount, or unit price
function cal_trilogi(products){
    let counter_up = 0, counter_a = 0, counter_p = 0;
    for (let i = 0; i < products.name.length; i++){
        let price = products.price[i],
            amount = products.amount[i],
            min_amount = products.min_amount[i],
            unit = products.unit[i],
            unit_price = products.unit_price[i],
            unit_to_price = products.unit_to_price[i];
        
        if(min_amount !== undefined && unit_price === undefined){
            // Find unit price
            if(unit?.includes('g')){
                if(amount === min_amount){
                    unit_to_price = 'Pr. kg';
                } else {
                    unit_to_price = 'Pr. kg max.';
                }
            } else if(unit?.includes('l')){
                if(amount === min_amount){
                    unit_to_price = 'Pr. liter';
                } else {
                    unit_to_price = 'Pr. liter max.';
                }
            }

            let cal_const = Math.pow(min_amount,2);
            if(unit === 'g' || unit === 'ml'){
                cal_const = 1000;
            } else if(unit === 'cl'){
                cal_const = 100;
            }

            unit_price = (cal_const / min_amount) * price;
            counter_up++;

        } else if(amount === undefined && unit_price !== undefined){
            // Find amount, based on unit_to_price
            if(unit_to_price.includes('kg')){
                const kg_to_g = 1000;
                amount = price / unit_price * kg_to_g;
                unit = 'g';
            } else if(unit_to_price.includes('liter')){
                const l_to_ml = 1000;
                const l_to_cl = 100;
                const amount_ml = price / unit_price * l_to_ml;
                const amount_cl = price / unit_price * l_to_cl;
                amount = amount_ml + 'ml / ' + amount_cl;
                unit = 'cl';
            }
            counter_a++;

        } /*else if(price !== undefined && amount !== undefined && unit_price !== undefined){
            // Find the correct unit measurement
            let cal_const = 1;
            if(unit === 'g' || unit === 'ml'){
                cal_const = 1000;
            } else if(unit === 'cl'){
                cal_const = 100;
            }
            console.log(min_amount, unit_price);

            // Validate price
            const temp_price = min_amount * unit_price / cal_const;
            if(Math.abs(price - temp_price) > 1){
                price = temp_price;
                counter_p++;
            }
        }*/

        // Assign the new calcs
        products.price[i] = price;
        products.amount[i] = amount;
        products.min_amount[i] = min_amount;
        products.unit[i] = unit;
        products.unit_price[i] = unit_price;
        products.unit_to_price[i] = unit_to_price;
    };
    console.log('Product Recalculated:');
    console.log('   Unit price:', counter_up);
    console.log('   Amount:', counter_a);
    console.log('   Price:', counter_p);

    return products;
}

export { scrape_bargains };
//scrape_bargains('https://avis.foetex.dk/naeste-uges-avis/'); // Replace with the URL of the site you want to scrape