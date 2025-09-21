import { price_up_and_down } from "./filter.js";
import { update_table } from "./table.js";
import { is_valid_input, warning_message } from "./error_and_warning.js";

async function bargains_script(bargains){
    let wishlist_bargains = [];

    document.getElementById('send_wish_req').addEventListener('click', () => {
        document.getElementById("send_wish_req").disabled = true;
        let invalid_input_found = false;
        wishlist_bargains = [];
        let wish_list = [];

        // Array fields
        let counter = 1;
        document.querySelectorAll('#wishlist_products_id input').forEach(input => {
            const value = input.value.trim();
            const errorText = input.nextElementSibling;

            // If the value is not empty, validate it
            if (value !== '' && isNaN(value)) {
                if(!is_valid_input(value)) {
                    invalid_input_found = true;
                    alert(`Input "${value}" in box #${counter} is invalid.\nAllowed characters: letters, numbers, commas, minus, and periods.`);
                    input.style.borderColor = 'var(--error-color)';
                    errorText.textContent = 'Ugyldigt input';
                } else {
                    wish_list.push(value);
                    input.style.borderColor = 'var(--primary-color)';
                    errorText.textContent = '';
                }
            }
            counter++;
        });
//console.log('Wish-list: ', wish_list);

        const table_body = document.querySelector('#result_id tbody');
        table_body.innerHTML = ''; // Clear previous data

        // Find the items from wishlist from the bargains
        for (let i = 0; i < wish_list.length; i++){
            let product_found = false;
            wishlist_bargains.push({ category: wish_list[i], items: [] });

            for (let j = 0; j < bargains.length; j++){
                if(bargains[j].name.toLowerCase().includes(wish_list[i].toLowerCase())){
                    product_found = true;

                    wishlist_bargains[wishlist_bargains.length - 1].items.push({ 
                        name: bargains[j].name, 
                        price: bargains[j].price, 
                        amount: bargains[j].amount,
                        min_amount: bargains[j].min_amount,
                        unit: bargains[j].unit, 
                        unit_price: bargains[j].unit_price,
                        unit_to_price: bargains[j].unit_to_price
                    });
                }
            }
            
            if (!product_found){
                console.log(`${wish_list[i]}: product not found`);
                warning_message(wish_list[i]);
                wishlist_bargains.pop();
            }
        }
 
        if(wishlist_bargains.length !== 0){
            update_table(wishlist_bargains);
            document.getElementById("result_id").style.visibility = "visible";
        } else {
            document.getElementById("result_id").style.visibility = "hidden";
        }
        
        document.getElementById("send_wish_req").disabled = false;
    });

    document.getElementById('filter_amount').addEventListener('click', () => {
        price_up_and_down('filter_amount', wishlist_bargains);
    })

    document.getElementById('filter_unit_price').addEventListener('click', () => {
        price_up_and_down('filter_unit_price', wishlist_bargains);
    })

};

window.addEventListener('pageshow', async () => {
    // Get bargains
    const bargains_raw = await fetch('/api/bargains');
    const bargains = await bargains_raw.json();
    console.log('Number of bargains:', bargains.length);
    console.log('Bargains retrieved from DB:', bargains);

    bargains_script(bargains);
    
    // 'Enter' activates the button with id 'send_wish_req'
    const inputs = document.querySelectorAll('#wishlist_products_id input[type="text"]');
    const searchButton = document.getElementById('send_wish_req');
    inputs.forEach(input => {
        input.addEventListener('keydown', (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                searchButton.click();
            }
        });
    });
});